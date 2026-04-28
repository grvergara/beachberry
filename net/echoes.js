const DEFAULT_SYNC_WINDOW_MS = 2_500;
const DEFAULT_SYNC_COOLDOWN_MS = 12_000;
const DEFAULT_STALE_ECHO_MS = 8_000;

function clamp01(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(1, numeric));
}

function randomHex(length = 8) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createEphemeralSessionId() {
  return `echo-${Date.now().toString(36)}-${randomHex(6)}`;
}

export function createEchoesController(options = {}) {
  const now = options.now ?? (() => performance.now());
  const syncWindowMs = Number.isFinite(options.syncWindowMs)
    ? Math.max(100, options.syncWindowMs)
    : DEFAULT_SYNC_WINDOW_MS;
  const syncCooldownMs = Number.isFinite(options.syncCooldownMs)
    ? Math.max(500, options.syncCooldownMs)
    : DEFAULT_SYNC_COOLDOWN_MS;
  const staleEchoMs = Number.isFinite(options.staleEchoMs)
    ? Math.max(1_000, options.staleEchoMs)
    : DEFAULT_STALE_ECHO_MS;
  const onStatus = options.onStatus ?? (() => {});
  const onSyncSpectacle = options.onSyncSpectacle ?? (() => {});

  const state = {
    enabled: Boolean(options.enabled),
    online: typeof navigator === "undefined" ? true : navigator.onLine !== false,
    handshakeState: "idle",
    sessionId: createEphemeralSessionId(),
    localSyncState: {
      key: "idle",
      eligible: false,
      reportedAt: 0,
      confidence: 0,
    },
    remoteEchoes: new Map(),
    lastSyncTriggerAt: 0,
    lastSyncKey: null,
    syncCount: 0,
  };

  function emitStatus(reason = "update") {
    onStatus(getStatusSnapshot(), reason);
  }

  function setEnabled(enabled) {
    state.enabled = Boolean(enabled);
    if (!state.enabled) {
      state.handshakeState = "disabled";
      emitStatus("disabled");
      return getStatusSnapshot();
    }
    if (!state.online) {
      state.handshakeState = "offline";
      emitStatus("offline");
      return getStatusSnapshot();
    }
    state.handshakeState = "idle";
    emitStatus("enabled");
    return getStatusSnapshot();
  }

  function setOnline(online) {
    state.online = Boolean(online);
    if (!state.online) {
      state.handshakeState = "offline";
      emitStatus("offline");
      return getStatusSnapshot();
    }
    if (!state.enabled) {
      state.handshakeState = "disabled";
      emitStatus("disabled");
      return getStatusSnapshot();
    }
    if (state.handshakeState === "offline") {
      state.handshakeState = "idle";
    }
    emitStatus("online");
    return getStatusSnapshot();
  }

  function beginOptInHandshake() {
    if (!state.enabled) {
      return null;
    }
    if (!state.online) {
      state.handshakeState = "offline";
      emitStatus("offline");
      return null;
    }
    const sentAt = now();
    state.handshakeState = "connecting";
    emitStatus("connecting");
    const packet = {
      type: "echo-hello",
      sessionId: state.sessionId,
      sentAt,
    };
    state.handshakeState = "connected";
    emitStatus("connected");
    return packet;
  }

  function ingestRemoteHandshake(payload = {}) {
    if (!payload.sessionId || payload.sessionId === state.sessionId) {
      return null;
    }
    const remote = state.remoteEchoes.get(payload.sessionId) ?? {
      sessionId: payload.sessionId,
      pose: {
        x: 0,
        y: 0,
        z: 0,
        yaw: 0,
      },
      targetPose: {
        x: 0,
        y: 0,
        z: 0,
        yaw: 0,
      },
      visible: true,
      confidence: 0.35,
      syncState: { key: "idle", eligible: false, reportedAt: 0, confidence: 0 },
      lastSeenAt: now(),
    };
    remote.lastSeenAt = now();
    remote.visible = true;
    state.remoteEchoes.set(remote.sessionId, remote);
    emitStatus("peer-joined");
    return { sessionId: remote.sessionId };
  }

  function publishLocalPose(pose = {}) {
    if (!state.enabled || state.handshakeState !== "connected") {
      return null;
    }
    return {
      type: "echo-pose",
      sessionId: state.sessionId,
      sentAt: now(),
      pose: {
        x: Number.isFinite(pose.x) ? pose.x : 0,
        y: Number.isFinite(pose.y) ? pose.y : 0,
        z: Number.isFinite(pose.z) ? pose.z : 0,
        yaw: Number.isFinite(pose.yaw) ? pose.yaw : 0,
      },
      syncState: { ...state.localSyncState },
    };
  }

  function ingestRemotePose(packet = {}) {
    if (!packet.sessionId || packet.sessionId === state.sessionId) {
      return null;
    }
    const remote = state.remoteEchoes.get(packet.sessionId) ?? {
      sessionId: packet.sessionId,
      pose: { x: 0, y: 0, z: 0, yaw: 0 },
      targetPose: { x: 0, y: 0, z: 0, yaw: 0 },
      visible: true,
      confidence: 0.25,
      syncState: { key: "idle", eligible: false, reportedAt: 0, confidence: 0 },
      lastSeenAt: now(),
    };
    const packetPose = packet.pose ?? {};
    remote.targetPose = {
      x: Number.isFinite(packetPose.x) ? packetPose.x : remote.targetPose.x,
      y: Number.isFinite(packetPose.y) ? packetPose.y : remote.targetPose.y,
      z: Number.isFinite(packetPose.z) ? packetPose.z : remote.targetPose.z,
      yaw: Number.isFinite(packetPose.yaw) ? packetPose.yaw : remote.targetPose.yaw,
    };
    if (!Number.isFinite(remote.pose.x)) {
      remote.pose = { ...remote.targetPose };
    }
    remote.syncState = {
      key: packet.syncState?.key ?? "idle",
      eligible: Boolean(packet.syncState?.eligible),
      reportedAt: Number.isFinite(packet.syncState?.reportedAt) ? packet.syncState.reportedAt : now(),
      confidence: clamp01(packet.syncState?.confidence ?? 0.5),
    };
    remote.confidence = clamp01(packet.syncState?.confidence ?? remote.confidence ?? 0.5);
    remote.lastSeenAt = now();
    remote.visible = true;
    state.remoteEchoes.set(remote.sessionId, remote);
    return { sessionId: remote.sessionId };
  }

  function setLocalSyncState(syncState = {}) {
    const snapshot = {
      key: syncState.key ?? "idle",
      eligible: Boolean(syncState.eligible),
      reportedAt: Number.isFinite(syncState.reportedAt) ? syncState.reportedAt : now(),
      confidence: clamp01(syncState.confidence ?? 0.5),
    };
    state.localSyncState = snapshot;
    return snapshot;
  }

  function tick() {
    const timeNow = now();
    for (const remote of state.remoteEchoes.values()) {
      const staleMs = timeNow - remote.lastSeenAt;
      if (staleMs >= staleEchoMs) {
        remote.visible = false;
        continue;
      }
      const alpha = clamp01(1 - staleMs / staleEchoMs);
      remote.confidence = alpha;
      remote.pose.x += (remote.targetPose.x - remote.pose.x) * 0.2;
      remote.pose.y += (remote.targetPose.y - remote.pose.y) * 0.2;
      remote.pose.z += (remote.targetPose.z - remote.pose.z) * 0.2;
      remote.pose.yaw += (remote.targetPose.yaw - remote.pose.yaw) * 0.2;
      remote.visible = alpha > 0.05;
    }
  }

  function detectSyncWindow(syncState = {}) {
    const local = setLocalSyncState(syncState);
    if (!state.enabled || state.handshakeState !== "connected" || !local.eligible) {
      return { triggered: false, reason: "inactive" };
    }
    const timeNow = now();
    if (timeNow - state.lastSyncTriggerAt < syncCooldownMs) {
      return { triggered: false, reason: "cooldown" };
    }
    for (const remote of state.remoteEchoes.values()) {
      if (!remote.visible || !remote.syncState.eligible) {
        continue;
      }
      if (remote.syncState.key !== local.key || !remote.syncState.key || remote.syncState.key === "idle") {
        continue;
      }
      const age = Math.abs(local.reportedAt - remote.syncState.reportedAt);
      if (age > syncWindowMs) {
        continue;
      }
      state.lastSyncTriggerAt = timeNow;
      state.lastSyncKey = local.key;
      state.syncCount += 1;
      const payload = {
        key: local.key,
        triggeredAt: timeNow,
        participants: [state.sessionId, remote.sessionId],
        boostMs: 7_500,
      };
      onSyncSpectacle(payload);
      emitStatus("sync-triggered");
      return { triggered: true, payload };
    }
    return { triggered: false, reason: "no-match" };
  }

  function getRemoteEchoes() {
    return [...state.remoteEchoes.values()].map((remote) => ({
      sessionId: remote.sessionId,
      pose: { ...remote.pose },
      targetPose: { ...remote.targetPose },
      visible: remote.visible,
      confidence: remote.confidence,
      lastSeenAt: remote.lastSeenAt,
      syncState: { ...remote.syncState },
    }));
  }

  function getStatusSnapshot() {
    return {
      enabled: state.enabled,
      online: state.online,
      handshakeState: state.handshakeState,
      sessionId: state.sessionId,
      remoteCount: [...state.remoteEchoes.values()].filter((remote) => remote.visible).length,
      lastSyncKey: state.lastSyncKey,
      syncCount: state.syncCount,
      localSyncState: { ...state.localSyncState },
    };
  }

  return {
    setEnabled,
    setOnline,
    beginOptInHandshake,
    ingestRemoteHandshake,
    publishLocalPose,
    ingestRemotePose,
    setLocalSyncState,
    detectSyncWindow,
    tick,
    getRemoteEchoes,
    getStatusSnapshot,
  };
}
