function createPassRecord(name, hooks = {}) {
  return {
    name,
    enabled: hooks.enabled ?? true,
    beforeRender: hooks.beforeRender ?? null,
    render: hooks.render ?? null,
    afterRender: hooks.afterRender ?? null,
  };
}

export function createPostComposer(options = {}) {
  const passes = [];
  const state = {
    exposure: options.exposure ?? 1,
    distortionFloor: options.distortionFloor ?? 0.05,
    saturation: 0.15,
    motionWarp: 0.02,
    psyIntensity: options.distortionFloor ?? 0.05,
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

  return {
    state,
    passes,
    registerPass,
    setPassEnabled,
    run,
    applyMeterSnapshot,
  };
}
