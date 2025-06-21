# namecheap-dns-updater

Update a Dynamic DNS domain on Namecheap with a new IP.  
Want `home.yourdomain.com` to point to your home IP?
This little CLI (and node module) lets you do that easily.

## Installation

```bash
# Install the `namecheap-dns-updater` binary globally, for CLI-usage
npm install -g namecheap-dns-updater

# Or, install the module locally to use the API
npm install --save namecheap-dns-updater
```

## CLI usage

```
$ namecheap-dns-updater --help

  Update the IP of a Dynamic DNS domain on Namecheap

  Usage
    $ namecheap-dns-updater --domain <domain-name> --password <ddns-password>

  Options
    --ip <someIp> IP to update record with. Defaults to current external IP.
    --host <host> Host the record belongs to, eg '@', 'www' etc. Defaults to '@'.
    --domain <domain-name> Domain to update, eg 'yourdomain.tld'
    --password <password> Dynamic DNS password

  Examples
    # Update the '@' record with a specific IP address
    $ namecheap-dns-updater --domain espen.codes --ip 127.0.0.1 --password myDdnsPassword

    # Update the 'www' record with your current external IP
    $ namecheap-dns-updater --host www --domain espen.codes --password myDdnsPassword

    # Update both '@' and 'www' records with your current external IP
    $ namecheap-dns-updater --host @ --host www --domain espen.codes --password myDdnsPassword

  Notes
    - The password is NOT your account password, it is a separate per-domain setting.
    - The values for the host and domain must be of the same case (lowercase/uppercase) as in your account.
    - Only IPv4 is supported at this time.
    - To update the wildcard subdomain, use '*' as the host

  Environment variables (fallbacks for missing flags)
    --host = NC_DDNS_HOST
    --domain = NC_DDNS_DOMAIN
    --password = NC_DDNS_PASSWORD
```

## Node usage

Requires Node 20 or above.

```js
import {update} from 'namecheap-dns-updater'

// Note: Leave `ip` undefined to update use your current external IP
update({
  host: 'www', // Host to update - can also be an array of hosts
  domain: 'mydomain.tld', // Domain name to update
  password: 'yourDdnsPassword', // Namecheap DDNS password
  ip: '193.212.1.10', // IP to update record with
}).then((newRecord) => {
  console.log('New record:', newRecord)
})
```

## Docker usage

The `ghcr.io/rexxars/namecheap-dns-updater:latest` [Docker image](https://github.com/rexxars/namecheap-dns-updater/pkgs/container/namecheap-dns-updater) can be used to update a DNS record. In this case, you may want to use environment variables to configure the tool:

```bash
docker run \
  -e NC_DDNS_HOST=@ \
  -e NC_DDNS_DOMAIN=mydomain.com \
  -e NC_DDNS_PASSWORD=yourToken \
  ghcr.io/rexxars/namecheap-dns-updater:latest
```

## License

MIT © [Espen Hovlandsdal](https://espen.codes/)
