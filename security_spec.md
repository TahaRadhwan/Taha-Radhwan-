# Firebase Security Specification

## 1. Data Invariants
*   **Authentication**: Users must be signed in for all write operations, and their email must be verified.
*   **Immutable Fields**: `createdAt`, `id`, and `code` cannot be altered after creation on a Shipment.
*   **Temporal Integrity**: Timestamps must be validated against the server's request time (`request.time`).
*   **Validation Boundaries**: String fields like `title`, `message`, etc. have strict length limits, and numeric fields must be non-negative.
*   **State Machine Transitions**: Transitions cannot bypass steps.
*   **Access Control**: A user can only access and write their own data, or if there is no user field, we enforce ownership boundaries securely.

## 2. The "Dirty Dozen" Threat Payloads
Here are the 12 attack payloads designed to violate system rules:

### Payload 1: Unauthorized Creation (Anonymous)
An unauthenticated or unverified client attempts to insert a custom shipment document.
```json
{
  "id": "unauth_shipment",
  "code": "BAD-111",
  "title": "Malicious Shipment",
  "cargoType": "electronics",
  "supplier": "Hacker Corp",
  "countryOfOrigin": "Yemen",
  "portOfDischarge": "Aden Port",
  "containerNumber": "ABCD-1234567",
  "weight": 10,
  "valueUSD": 1000,
  "valueLocal": 250000,
  "carrierName": "Pirate Shipping",
  "currentStatus": "purchased",
  "documents": [],
  "logs": [],
  "dutiesPaid": false,
  "transitProgress": 0,
  "createdAt": "2026-07-17 14:00"
}
```

### Payload 2: Privilege Escalation via Shadow Fields (The "Ghost Field" Attack)
Adding unvalidated admin flags inside a user's shipment update.
```json
{
  "id": "ship_solar_systems",
  "code": "YE-90214",
  "title": "Injected Admin Field",
  "isAdmin": true,
  "dutiesPaid": true
}
```

### Payload 3: Spoofing Owner ID (Identity Theft)
Attempting to create a shipment with `ownerId` set to another user.
```json
{
  "id": "ship_solar_systems",
  "ownerId": "victim_user_id",
  "title": "Spoofed Owner"
}
```

### Payload 4: Overwriting Immutable CreatedAt Time (Temporal Modification)
An attacker tries to update the `createdAt` timestamp to hide delays.
```json
{
  "createdAt": "1999-01-01 00:00"
}
```

### Payload 5: Denying Wallet (Resource Exhaustion String Payload)
Injecting a 10MB base64 string as a document name to trigger massive Firestore storage costs.
```json
{
  "title": "A".repeat(10000000)
}
```

### Payload 6: Skipping Customs Steps (State Machine Bypass)
Moving status directly from `purchased` to `delivered` bypassing all intermediate inspection, testing, and payment gates.
```json
{
  "currentStatus": "delivered"
}
```

### Payload 7: Fake Email Verification Spoofing (Unverified Writer)
An authenticated user with `email_verified: false` attempts to write documents.

### Payload 8: Corrupting Numeric Weights (Negative Boundaries)
Attempting to write a negative cargo weight to break calculation algorithms.
```json
{
  "weight": -999.5
}
```

### Payload 9: Invalid Document ID Poisoning (Path Attack)
Attempting to write to an ID containing illegal non-alphanumeric directory traversal characters.
`databases/$(database)/documents/shipments/../../illegal_override`

### Payload 10: Modifying Terminated Shipment States (Post-Terminal Update)
Attempting to edit properties of a shipment that has already been marked as `delivered`.
```json
{
  "title": "Malicious Modification on Completed Shipment"
}
```

### Payload 11: Injecting Spoofed Quality and Compliance Certificates
Setting a fake certified quality flag or manual lab override bypass without inspection.
```json
{
  "labResult": "passed",
  "inspectionChannel": "green"
}
```

### Payload 12: Broad Reader Query scraping (PII Blanket read)
An authenticated user queries other users' active notifications without any document ID boundaries.

---

## 3. Conceptual Test Suite (firestore.rules.test.ts)
A test runner would execute transactions with these payloads and verify that each operation yields `PERMISSION_DENIED`.
