# Development Guide

## Repository Branches

- `main`: The main branch for stable releases.
- `dev`: The development branch for ongoing work.
- `store`: Special branch for Plugin Store release.
- `external`: Branch for external importer source code.
- `gh-pages`: Branch for external importer release.

## Plugin Structure

Based on Decky Loader architecture, Decky Clash consists of the following components:

```sh
~/homebrew
├── plugins
│   └── DeckyClash
│       ├── bin             # Dependency Binaries
│       │   ├── mihomo
│       │   └── yq
│       ├── dist            # Decky frontend
│       │   ├── index.html
│       │   └── ...
│       ├── external        # External importer
│       │   ├── index.html
│       │   └── ...
│       ├── data            # Initial resources
│       │   └── ...
│       ├── py_modules      # Python modules
│       ├── main.py         # Plugin entrypoint
│       ├── override.yaml   # Override manifest
│       ├── package.json    # Package manifest
│       └── plugin.json     # Plugin metadata
├── data
│   └── DeckyClash
│       ├── dashboard       # Dashboards
│       │   ├── metacubexd
│       │   ├── yacd
│       │   ├── zashboard
│       │   └── ...         # Other dashboards
│       ├── asn.mmdb        # Geo files (below)
│       ├── country.mmdb
│       └── geosite.dat
├── settings
│   └── DeckyClash
│       ├── subscriptions   # Subscription files
│       │   └── ...
│       └── config.json     # Settings
└── logs
    └── DeckyClash
        └── ...
```

## Settings Structure

The settings json file is located at `~/homebrew/settings/DeckyClash/config.json` by default.

```jsonc
{
  "subscriptions": {
    // Subscriptions Dictionary
    //   Key: Subscription Name
    //     (with .yaml extension is corresponding file name)
    //   Value: Subscription URL
    //     (supports http(s)://... and file://...)
    "Example": "file://example_url"
    // ~/homebrew/settings/DeckyClash/subscriptions/Example.yaml
  },
  "current": "Example",         // Current subscription. Default: [none]
  "dashboard": "yacd",          // Current dashboard. Default: [none]
  "secret": "RANDOM_SECRET",    // Controller secret. Default: [random]
  "override_dns": true,         // Override DNS settings. Default: true
  "enhanced_mode": "fake-ip",   // Enhanced mode. Default: fake-ip
  "controller_port": 9090,      // Controller port. Default: 9090
  "external_port": 50581,       // External importer port. Default: 50581
  "allow_remote_access": false, // Allow remote access. Default: false
  "autostart": true,            // Autostart after loaded. Default: false
  "timeout": 15.0,              // Resource query timeout (s). Default: 15.0
  "debounce_time": 10.0,        // Query debounce time (s). Default: 10.0
  "disable_verify": false,      // Disable verify SSL. Default: false
  "external_run_bg": false,     // Run external importer in background. Default: false
  "auto_check_update": true,    // Auto check update. Default: true
  "skip_steam_download": false, // Skip proxy for Steam download. Default: false
  "log_level": "DEBUG"          // Log level. Default: INFO
}
```
