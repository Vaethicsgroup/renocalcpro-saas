# Runbook — Bug OVH VPS-2 2027 : cloud-init n'installe pas la clé SSH

**Cible** : VPS OVH offre **VPS-2 2027** (4 vCores / 8 Go RAM / 75 Go SSD) sur image Ubuntu 24.04 LTS ou Debian 12.

**Symptôme observé (juin 2026)** : après une réinstallation OVH (via l'interface OU l'API `POST /vps/{}/rebuild`), la clé SSH publique fournie n'est **pas** déployée dans `/root/.ssh/authorized_keys` — bien que la tâche OVH remonte `state: done`. Les tentatives SSH par clé se soldent par `Authentications that can continue: publickey,password`, la clé est offerte, rejetée. Les tentatives d'auth par mot de passe (nouveau password reçu par email) échouent aussi la plupart du temps sur ce VPS.

**Impact** : nouveau VPS complètement injoignable en SSH tant que le contournement ci-dessous n'a pas été appliqué.

**Confirmé sur** : 5 réinstallations API (Ubuntu 24.04 imageId `c8c0c95a-ee54-4c28-829d-0da80804f63b`, Debian 12 imageId `523544fe-d756-4ab5-b522-359cb9f3cf5f`), 2 combinaisons de paramètres (`sshKey` par nom + `publicSshKey` en direct), `doNotSendPassword: true` et `false`. Toutes conforment le bug.

---

## Contournement validé (juin 2026) — Mode Rescue + montage disque

### Prérequis
- Clé SSH ed25519 locale, **sans passphrase de préférence** (BatchMode SSH ne gère pas les passphrases). Créer avec `ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -C "mail@perso.tld"`.
- Manager OVH accessible avec identifiants comptes.

### Étape 1 — Ajouter la clé au compte OVH (une seule fois)

```bash
# Depuis le browser logué sur manager.eu.ovhcloud.com, console JS :
fetch('/engine/apiv6/me/sshKey', {
  method: 'POST',
  credentials: 'include',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    key: 'ssh-ed25519 AAAAC3... user@host',
    keyName: 'flora-mac-ed25519'
  })
}).then(r => r.text()).then(console.log)
```

Attendre `200` + body `null` = succès. Vérifier via `GET /me/sshKey` que le nom apparaît.

### Étape 2 — Passer le VPS en mode rescue via API

```bash
# Requiert session OVH manager active
fetch('/engine/apiv6/vps/vps-xxxxxxxx.vps.ovh.net', {
  method: 'PUT',
  credentials: 'include',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({netbootMode: 'rescue'})
}).then(r => r.text()).then(console.log)
```

Puis attendre 30-60 s. Le VPS redémarre automatiquement en mode rescue (un mini-Debian 12 en RAM). OVH envoie un **email avec un mot de passe rescue** dédié (différent du root habituel). Le MOTD SSH affiche aussi le password.

### Étape 3 — SSH rescue + montage du disque réel

```bash
ssh-keygen -R <IP_VPS>     # purge l'ancienne host key
ssh root@<IP_VPS>          # password du mail rescue
```

Une fois connecté (prompt `[RESCUE] root@vps-xxx:~ $`), monter le disque du vrai Ubuntu — attention `/dev/sda1` c'est le rescue lui-même, **le vrai disque est `/dev/sdb1`** (label `cloudimg-rootfs`, ~74 Go) :

```bash
lsblk -f                        # confirme sdb1 en cloudimg-rootfs
mkdir -p /mnt/ubuntu
mount /dev/sdb1 /mnt/ubuntu
cat /mnt/ubuntu/etc/os-release | head -3   # confirme "Ubuntu 24.04"
```

### Étape 4 — Injecter la clé SSH + overrides sshd + override cloud-init

```bash
# Clé publique (adapter avec la tienne)
PUBKEY='ssh-ed25519 AAAAC3... mail@perso.tld'

# root
mkdir -p /mnt/ubuntu/root/.ssh
echo "$PUBKEY" > /mnt/ubuntu/root/.ssh/authorized_keys
chmod 700 /mnt/ubuntu/root/.ssh
chmod 600 /mnt/ubuntu/root/.ssh/authorized_keys
chown -R 0:0 /mnt/ubuntu/root/.ssh

# ubuntu user (si créé par le premier boot)
if [ -d /mnt/ubuntu/home/ubuntu/.ssh ]; then
  echo "$PUBKEY" > /mnt/ubuntu/home/ubuntu/.ssh/authorized_keys
  chmod 700 /mnt/ubuntu/home/ubuntu/.ssh
  chmod 600 /mnt/ubuntu/home/ubuntu/.ssh/authorized_keys
  chown -R 1000:1000 /mnt/ubuntu/home/ubuntu/.ssh
fi

# Override cloud-init pour empêcher qu'un futur run n'écrase la clé
cat > /mnt/ubuntu/etc/cloud/cloud.cfg.d/99-ssh-safeguard.cfg <<CFG
disable_root: false
ssh_pwauth: false
ssh_deletekeys: false
users:
  - default
  - name: root
    ssh_authorized_keys:
      - $PUBKEY
CFG

# Override sshd pour l'auth par clé sans ambiguïté
cat > /mnt/ubuntu/etc/ssh/sshd_config.d/99-safeguard.conf <<CFG
PermitRootLogin prohibit-password
PubkeyAuthentication yes
PasswordAuthentication no
CFG
```

### Étape 5 — Démonter + retour en boot local

```bash
umount /mnt/ubuntu
exit           # ferme la session rescue
```

Puis via l'API OVH depuis la console browser :

```javascript
fetch('/engine/apiv6/vps/vps-xxxxxxxx.vps.ovh.net', {
  method: 'PUT', credentials: 'include',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({netbootMode: 'local'})
}).then(r => r.text()).then(console.log)

// Attendre 15-30 s pour que setNetboot soit "done", puis :
fetch('/engine/apiv6/vps/vps-xxxxxxxx.vps.ovh.net/reboot', {
  method: 'POST', credentials: 'include',
  headers: {'Content-Type': 'application/json'}, body: ''
}).then(r => r.text()).then(console.log)
```

### Étape 6 — Validation SSH depuis le Mac

Après ~90 s (le temps du reboot + cloud-init + startup sshd) :

```bash
ssh-keygen -R <IP_VPS>
ssh -o BatchMode=yes -o ConnectTimeout=10 root@<IP_VPS> \
  "echo SSH_OK && hostname && cat /etc/os-release | grep PRETTY_NAME"
```

Retour attendu : `SSH_OK`, hostname du VPS, `PRETTY_NAME="Ubuntu 24.04.4 LTS"`. À ce moment tu peux enchaîner sur le bootstrap sécurité (`scripts/vps-bootstrap.sh`).

---

## Diagnostic pour vérifier si tu es affecté

Symptôme = SSH verbose retourne :

```
debug1: Offering public key: ... SHA256:XXX ...
debug1: Authentications that can continue: publickey,password
```

au lieu de :

```
debug1: Server accepts key: ...
```

Combiné avec un mail OVH mentionnant un mot de passe root qui ne fonctionne pas non plus → tu es sur ce bug.

## À rapporter à OVH support

Si tu ouvres un ticket, joins :
- Tes IDs de tâche `reinstallVm` (récupérables via `GET /vps/{}/tasks`)
- Le paramètre `sshKey` (nom) ou `publicSshKey` (clé complète) utilisé dans le body POST
- Le retour SSH verbose montrant le rejet
- La confirmation que `GET /me/sshKey/{name}` retourne bien ta clé au bon format

## Références internes

Tickets créés lors de la résolution initiale (juin 2026) :
- Task IDs de tests : 77345726, 77346484, 77348118, 77348727, 77349087, 77415911
- Toutes remontent `state: done, progress: 100` sans jamais installer la clé.
