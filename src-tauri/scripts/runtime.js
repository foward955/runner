const { core } = Deno;
const { op_print_msg } = Deno.core.ops;

function argsToMessage(...args) {
  return args.map((arg) => JSON.stringify(arg)).join(" ");
  // return args;
}

globalThis.runjs = {
  printMsg: (s) => {
    return op_print_msg(s);
  },
};

globalThis.console = {
  log: (...args) => {
    // core.print(`${argsToMessage(args)}\n`, false);
    runjs.printMsg(`${argsToMessage(args)}\n`);
  },
  error: (...args) => {
    core.print(`${argsToMessage(args)}\n`, true);
  },
};
