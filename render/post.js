function createPassRecord(name, hooks = {}) {
  return {
    name,
    enabled: hooks.enabled ?? true,
    beforeRender: hooks.beforeRender ?? null,
    render: hooks.render ?? null,
    afterRender: hooks.afterRender ?? null,
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function createPostComposer(options = {}) {
  const passes = [];
  const materialTargets = new Set();
  const state = {
    exposure: options.exposure ?? 1,
    distortionFloor: options.distortionFloor ?? 0.05,
    saturation: 0.15,
    motionWarp: 0.02,
    psyIntensity: options.distortionFloor ?? 0.05,
    mutation: {
      elapsedMs: 0,
      meter: options.distortionFloor ?? 0.05,
      vegetation: {
        colorShift: 0,
        sway: 0,
        silhouetteWarp: 0,
      },
      structure: {
        edgeGlow: 0,
        hueOffset: 0,
        bend: 0,
      },
      uniforms: {
        uMutationTime: 0,
        uMutationMeter: options.distortionFloor ?? 0.05,
        uMutationResidualFloor: options.distortionFloor ?? 0.05,
        uVegetationSway: 0,
        uVegetationColorShift: 0,
        uStructureHueOffset: 0,
        uStructureEdgeGlow: 0,
      },
    },
  };

  function registerPass(name, hooks = {}) {
    const pass = createPassRecord(name, hooks);
    passes.push(pass);
    return pass;
  }

  function setPassEnabled(name, enabled) {
    const pass = passes.find((candidate) => candidate.name === name);
    if (pass) {
      pass.enabled = Boolean(enabled);
    }
    return pass;
  }

  function run(context = {}) {
    for (const pass of passes) {
      if (!pass.enabled) {
        continue;
      }
      if (pass.beforeRender) {
        pass.beforeRender(context, state);
      }
      if (pass.render) {
        pass.render(context, state);
      }
      if (pass.afterRender) {
        pass.afterRender(context, state);
      }
    }
  }

  function applyMeterSnapshot(snapshot) {
    if (!snapshot) {
      return state;
    }
    const intensity = Math.max(state.distortionFloor, snapshot.psyIntensity ?? 0);
    state.psyIntensity = intensity;
    state.saturation = 0.1 + intensity * 0.9;
    state.motionWarp = 0.01 + intensity * 0.08;
    state.exposure = 0.95 + intensity * 0.2;
    return state;
  }

  function applyMutationSnapshot(snapshot = {}) {
    const meter = clamp01(snapshot.psyIntensity ?? snapshot.normalized ?? state.mutation.meter);
    const residualFloor = clamp01(snapshot.residualFloor ? snapshot.residualFloor / 100 : state.distortionFloor);
    state.mutation.meter = meter;
    state.mutation.vegetation.colorShift = 0.08 + meter * 0.55;
    state.mutation.vegetation.sway = 0.02 + meter * 0.22;
    state.mutation.vegetation.silhouetteWarp = 0.01 + meter * 0.12;
    state.mutation.structure.edgeGlow = 0.04 + meter * 0.45;
    state.mutation.structure.hueOffset = meter * 0.32;
    state.mutation.structure.bend = 0.005 + meter * 0.06;
    state.mutation.uniforms.uMutationMeter = meter;
    state.mutation.uniforms.uMutationResidualFloor = residualFloor;
    state.mutation.uniforms.uVegetationSway = state.mutation.vegetation.sway;
    state.mutation.uniforms.uVegetationColorShift = state.mutation.vegetation.colorShift;
    state.mutation.uniforms.uStructureHueOffset = state.mutation.structure.hueOffset;
    state.mutation.uniforms.uStructureEdgeGlow = state.mutation.structure.edgeGlow;
    return state.mutation;
  }

  function tickMutation(deltaMs = 0, snapshot) {
    state.mutation.elapsedMs += Math.max(0, deltaMs);
    state.mutation.uniforms.uMutationTime = state.mutation.elapsedMs / 1000;
    if (snapshot) {
      applyMutationSnapshot(snapshot);
    }

    for (const target of materialTargets) {
      if (typeof target === "function") {
        target(state.mutation.uniforms, state);
        continue;
      }
      if (!target || typeof target !== "object") {
        continue;
      }
      const uniforms = target.uniforms ?? target;
      for (const [uniformName, value] of Object.entries(state.mutation.uniforms)) {
        if (!(uniformName in uniforms)) {
          continue;
        }
        if (uniforms[uniformName] && typeof uniforms[uniformName] === "object" && "value" in uniforms[uniformName]) {
          uniforms[uniformName].value = value;
        } else {
          uniforms[uniformName] = value;
        }
      }
    }
    return state.mutation.uniforms;
  }

  function registerMutationMaterialTarget(target) {
    if (!target) {
      return () => {};
    }
    materialTargets.add(target);
    return () => materialTargets.delete(target);
  }

  return {
    state,
    passes,
    registerPass,
    setPassEnabled,
    run,
    applyMeterSnapshot,
    applyMutationSnapshot,
    tickMutation,
    registerMutationMaterialTarget,
  };
}
