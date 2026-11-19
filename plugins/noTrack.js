// Blocks Discord's analytics ("science") and Sentry error-report requests.
Twilight.definePlugin({
  name: 'NoTrack',
  vs: "Sends analytics (science) and error reports to Discord",
  desc: 'Blocks analytics and error-report requests',
  start() {
    this.hook = req => /\/api\/v\d+\/(science|track)(\/|\?|$)|sentry\.io\//.test(req.url) ? 'block' : undefined;
    Twilight.net.add(this.hook);
  },
  stop() { Twilight.net.remove(this.hook); },
});
