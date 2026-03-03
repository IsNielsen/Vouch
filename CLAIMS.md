  Independent Claim 1 — Method (Document Signing Process)

  A method for producing a cryptographically verifiable signature on a digital document, comprising:

  1. A server processor receiving an upload of a document object and computing a SHA-256 hash of said document object;
  2. The server generating a WebAuthn authentication challenge and storing, in an httpOnly server-side session cookie inaccessible to client-side scripts, a data structure comprising: the authentication challenge, the
  document hash, and a user identifier bound to a signing session identifier;
  3. The server receiving a WebAuthn authentication assertion from a hardware authenticator coupled to a client device, the assertion comprising an authenticator data structure signed by a private key stored exclusively
  within said hardware authenticator;
  4. The server verifying the authentication assertion against the stored challenge and a previously registered credential public key, requiring user verification to be flagged as present in the authenticator data;
  5. Upon successful verification, the server deriving a post-quantum cryptographic seed by applying an HMAC-SHA-256 function keyed with a server-held secret to an input string comprising a domain prefix concatenated with
  the credential identifier of the hardware authenticator;
  6. The server generating an ML-DSA-65 key pair from said seed, applying the resulting secret key to the document hash to produce a post-quantum signature, and retaining the secret key only in volatile process memory
  for the duration of the signing operation, without persisting it to any durable storage medium;
  7. The server persisting to a database record: the document hash, the post-quantum signature, the derived post-quantum public key, the authenticator data structure, and the credential identifier; and
  8. Updating an authenticator usage counter in the database to a value greater than the previously stored counter, and rejecting any future assertion presenting a counter value not exceeding the stored value.

  ---
  Independent Claim 2 — System (Server-Implemented Apparatus)

  A server-implemented system for quantum-resistant document signing, comprising:

  1. One or more processors configured to maintain a document session store associating a session identifier with a document object stored in a remote object storage service;
  2. A challenge-binding module configured to generate a cryptographic challenge and embed, within an httpOnly server-side cookie scoped to a session identifier, a binding between said challenge and a SHA-256 hash of the
  document object, such that the challenge cannot be satisfied without the signing party authenticating against the specific document;
  3. A WebAuthn verification module configured to verify, against a stored credential public key and expected relying-party origin, a FIDO2 authentication assertion received from a hardware authenticator, requiring
  resident-key and user-verification flags to be set;
  4. A stateless key derivation module configured to, upon successful WebAuthn verification, deterministically derive an ML-DSA-65 key pair by: importing a server-held secret as an HMAC-SHA-256 key, computing an HMAC over a
  namespaced credential identifier string, truncating the output to a 32-byte seed, and passing said seed to an ML-DSA key generation function — with no step persisting the derived secret key beyond the signing operation;
  5. A signature storage module configured to write to a relational database a signature record comprising: the document hash, the post-quantum signature bytes, the post-quantum public key, the WebAuthn authenticator data, a
   credential identifier, an authentication method label, and an IP address; and
  6. A cloning-detection module configured to reject any authentication assertion whose authenticator counter value is less than or equal to the stored counter value for the presenting credential.

  ---
  Independent Claim 3 — Method (Passwordless Identity Enrollment)

  A method for enrolling a device-bound cryptographic identity without a persistent password or stored biometric, comprising:

  1. A server generating WebAuthn registration options specifying resident-key requirement and user-verification requirement, and storing the registration challenge in an httpOnly cookie;
  2. The server receiving a WebAuthn registration response from a hardware authenticator and verifying it against the stored challenge, expected origin, and relying-party identifier derived from the HTTP Host header of the
  originating request;
  3. Upon successful verification, the server creating a user account identified by a deterministic internal email address of the form passkey-{UUID}@{internal-domain}, with email confirmation bypassed via a service-role
  API;
  4. The server storing the credential identifier, COSE-encoded public key, initial counter value, authenticator AAGUID, and transport hints in a credentials table accessible only to service-role operations;
  5. The server generating a single-use token by invoking a magic-link generation API for the internal email address, and returning only the hashed token to the client — the raw email address never leaving the server; and
  6. The client consuming the hashed token via OTP verification to establish a session cookie, completing authentication without transmission of any password, raw biometric data, or email address to the client.

  ---
  What Vouch Owns (Core Novelties)

  ┌─────┬─────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │  #  │                 Concept                 │                                                                                Why Novel                                                                                │
  ├─────┼─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ A   │ Challenge-bound document hash           │ The WebAuthn challenge itself is cryptographically coupled to the specific document's SHA-256 hash via the server-side cookie — the biometric act is the document       │
  │     │                                         │ authorization, not merely access control                                                                                                                                │
  ├─────┼─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ B   │ Stateless PQC key derivation            │ ML-DSA keys are re-derived ephemerally per signing event via HMAC(secret, "pqc-v1:" + credential_id) — no PQC key is ever stored anywhere                               │
  ├─────┼─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ C   │ Dual-layer hardware + post-quantum      │ Every signature carries both a FIDO2 hardware assertion and an ML-DSA-65 signature on the same document hash                                                            │
  │     │ signature                               │                                                                                                                                                                         │
  ├─────┼─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ D   │ Host-header-derived RP identity         │ rpID and origin are derived dynamically from the incoming request's Host header, enabling deployment-agnostic passkey validation                                        │
  ├─────┼─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ E   │ Anonymized passkey identity             │ User accounts are created with internal synthetic emails; no PII is required or stored for passkey enrollment                                                           │
  └─────┴─────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  The strongest and most novel combination is A + B + C — no prior art we're aware of combines WebAuthn challenge-binding to a document hash with ephemeral ML-DSA signing derived from the passkey credential ID.
