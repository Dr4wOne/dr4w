# My home hub

How the owner's own dr4w home hub runs: the open-source kit
([Dr4wOne/dr4w-home](https://github.com/Dr4wOne/dr4w-home)) plus a private local config. It replaces the
TV bridge from the `tv` app. This guide holds no addresses, identifiers or secrets; those live only on the
hub machine.

## Where things are
| Thing | Where |
|---|---|
| Kit checkout | `~/workspace/dr4w-home` (the hub runs from `apps/hub`) |
| Config: devices, scenes, port | `~/.config/dr4w-home/config.json` (mode 0600) |
| TV credentials (client key, certificate, pinned TV certificate, address) | `~/.config/dr4w-home/android-tv/<tv>/` (mode 0700, files 0600) |
| Phone sign-in key | `~/.config/dr4w-home/hub-secret` |
| Privacy deny-list and scrub salt | `~/.config/dr4w-home/deny-list.txt`, `~/.config/dr4w-home/salt` |
| Raw device recordings (never in a repo) | `~/.config/dr4w-home/fixtures-raw/` |
| Service | `~/.config/systemd/user/dr4w-home-hub.service`; logs: `journalctl --user -u dr4w-home-hub -f` |

## Switch over from the TV bridge (once)
```bash
cp ~/workspace/dr4w-home/apps/hub/dr4w-home-hub.service ~/.config/systemd/user/
# edit WorkingDirectory if the checkout is not at ~/dr4w-home, and set ExecStart to the full
# Node 24 path (`which node`): systemd does not load nvm
systemctl --user stop tv-bridge && systemctl --user disable tv-bridge
systemctl --user daemon-reload && systemctl --user enable --now dr4w-home-hub
curl -s http://127.0.0.1:8790/health
```
Then sign the phone in again (the cookie changed): `pnpm hub link` in the kit checkout, scan the QR
code. **Rollback:** `systemctl --user disable --now dr4w-home-hub && systemctl --user enable --now tv-bridge`.

## Remote access
Through Tailscale only (the kit's [remote-access.md](https://github.com/Dr4wOne/dr4w-home/blob/main/docs/remote-access.md)): the hub machine renamed to a neutral name,
HTTPS certificates on, `sudo tailscale serve --bg 8790`, the iPhone app with VPN On Demand "Always",
and the app added to the Home Screen from the `https://…ts.net` address. Set `DR4W_HOME_URL` in the
service to that address so sign-in links use it, and `"bind": "127.0.0.1"` in the config so plain
HTTP is not reachable on the Wi-Fi. There is no public endpoint and no port forward.

## Backup
Back up `~/.config/dr4w-home/` (encrypted, not to a public place): it holds the credentials and scenes.
Without it the TV only needs pairing again (`pnpm hub pair <tv-address>`, about a minute in front of the
TV).

## Rules for this hub
- Never send a test command to the TV from cached state, and not while someone may be watching without
  agreeing first (an incident on 2026-10-16 interrupted YouTube; see the kit's [discovery.md](https://github.com/Dr4wOne/dr4w-home/blob/main/docs/discovery.md)).
- Anything recorded from the TV goes through the kit's `node scripts/privacy.ts scrub` before it enters
  any repository.
- The `idea/tv` branch of this repo holds raw TV identifiers and must not be pushed; a local `pre-push`
  hook refuses it.
