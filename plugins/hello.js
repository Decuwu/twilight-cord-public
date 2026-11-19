Twilight.definePlugin({
  name: 'Hello',
  devOnly: true, // Off until switched on in the menu (example plugin).
  vs: "Nothing (a tiny test plugin)",
  desc: 'Example plugin: logs to the console',
  start() { console.log('%c[twilight]', 'color:#6cc8ff', 'hello plugin started'); },
  stop() { console.log('%c[twilight]', 'color:#6cc8ff', 'hello plugin stopped'); },
  // Source patching example (needs a real string from Discord's code to match):
  // patches: [{ find: 'some unique string', replacement: { match: /old/, replace: '$self.myFn(old)' } }],
});
