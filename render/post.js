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

  return {
    state,
    passes,
    registerPass,
    setPassEnabled,
    run,
  };
}
