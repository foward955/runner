const { core } = Deno;

function argsToMessage(args) {
  if (args.length === 1) {
    return JSON.stringify(args[0]);
  } else {
    return args.map((arg) => JSON.stringify(arg)).join(" ");
  }
}

globalThis.runjs = {
  printMsg: (s) => {
    return core.ops.op_print_msg(s);
  },
};

globalThis.console = {
  log: (...args) => {
    runjs.printMsg(`${argsToMessage(args)}\n`);
  },
  error: (...args) => {
    core.print(`${argsToMessage(args)}\n`, true);
  },
};
