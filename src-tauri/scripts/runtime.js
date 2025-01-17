const { core } = Deno;
const { op_print_msg, op_print } = Deno.core.ops;

function argsToMessage(args) {
  if (args.length === 1) {
    return JSON.stringify(args[0]);
  } else {
    return args.map((arg) => JSON.stringify(arg)).join(" ");
  }
}

globalThis.runjs = {
  printMsg: (s) => {
    return op_print_msg(s);
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
