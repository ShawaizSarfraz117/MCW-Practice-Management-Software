import nodeConfig from "@mcw/eslint-config/node";

export default [
  ...nodeConfig,
  {
    ignores: ["dist/", "node_modules/"]
  }
];