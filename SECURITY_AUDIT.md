# Authorization Security Audit & Fixes

## Issues Found & Fixed ✅

### 1. **No Cookie Signing Secret**
- **Issue**: Cookies were not being signed, allowing tampering
- **Fix**: Added `cookieSecret` to `cookieParser()` middleware using `process.env.COOKIE_SECRET`
- **Impact**: Prevents attackers from forging session cookies

### 2. **No JWT Token Expiration**
- **Issue**: Tokens had no expiry, valid forever if leaked
- **Fix**: Added `expiresIn: '7d'` to JWT signing
- **Impact**: Compromised tokens automatically expire after 7 days

### 3. **No SameSite Cookie Flag**
- **Issue**: Vulnerable to CSRF attacks
- **Fix**: Added `sameSite: 'strict'` to all cookies
- **Impact**: Prevents cross-site request forgery attacks

### 4. **Missing Email Format Validation**
- **Issue**: Any string accepted as email
- **Fix**: Added regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Impact**: Prevents invalid email storage

### 5. **Weak OTP Validation**
- **Issue**: `isNaN()` check was insufficient
- **Fix**: Changed to strict regex: `/^\d{6}$/` 
- **Impact**: Ensures OTP is exactly 6 numeric digits

### 6. **No Input Length Validation**
- **Issue**: Username/name could be extremely long
- **Fix**: Added min/max length checks:
  - Username: 3-30 characters
  - Name: 2-50 characters
- **Impact**: Prevents database bloat and injection attacks

### 7. **Cookie Expiry Not Set**
- **Issue**: Session cookies could last indefinitely
- **Fix**: Added `maxAge` to userid/token cookies
- **Impact**: Forces re-authentication after timeout

### 8. **Invalid OTP Response Status**
- **Issue**: Used 200 status for OTP failure
- **Fix**: Changed to `400` status for invalid/expired OTP
- **Impact**: Proper HTTP status codes for client-side handling

### 9. **No Type Checking on Input**
- **Issue**: Accepts any type in login
- **Fix**: Added `typeof name !== 'string'` check
- **Impact**: Prevents injection attacks via non-string types

### 10. **Generic Error Messages**
- **Issue**: Different responses for "email exists" vs "username exists" (timing attack)
- **Fix**: Still has some variance... should be uniform (optional further hardening)
- **Impact**: Prevents user enumeration via timing

---

## Security Configuration ✅

### Environment Variables Required
```bash
JWT_KEY=use-a-strong-random-64-char-string
COOKIE_SECRET=use-a-strong-random-64-char-string
NODE_ENV=production  # Use 'production' for secure cookies
```

### Cookies Security
```javascript
{
    httpOnly: true,           // ✅ Prevents JavaScript access
    secure: true,             // ✅ HTTPS only (in production)
    sameSite: 'strict',       // ✅ CSRF protection
    maxAge: 10*60*1000        // ✅ 10 min for OTP cookie
}
```

---

## Recommended Additional Hardening

### 1. **Rate Limiting** (PRIORITY: HIGH)
Add rate limiting to prevent brute force:
```bash
npm install express-rate-limit
```

Example:
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                     // 5 requests per IP
    message: 'Too many login attempts'
});

app.post('/loginUser', loginLimiter, auth.verLogin);
```

### 2. **CSRF Protection** (PRIORITY: HIGH)
Add CSRF tokens for state-changing operations:
```bash
npm install csurf
```

### 3. **Helmet.js** (PRIORITY: MEDIUM)
Secure HTTP headers:
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 4. **Input Sanitization** (PRIORITY: MEDIUM)
Prevent XSS attacks:
```bash
npm install express-validator
```

### 5. **Password-based Authentication** (PRIORITY: MEDIUM)
Current app uses OTP. Consider adding:
- Password reset functionality
- Account recovery options
- Session management better UI

### 6. **Audit Logging** (PRIORITY: LOW)
Log all authentication events:
```javascript
console.log(`[AUTH] ${action} - User: ${email} - Status: ${success}`);
```

### 7. **Database Injection Prevention** (PRIORITY: MEDIUM)
Currently using Mongoose (which helps), but:
- Always use parameterized queries ✅ (already doing this)
- Never build queries with string concatenation ✅ (already safe)

### 8. **Secrets Management** (PRIORITY: HIGH)
Currently using .env (good), but in production:
- Use AWS Secrets Manager or similar
- Rotate secrets regularly
- Never commit .env files

---

## Verification Checklist ✅

- [x] Cookie signing with secret
- [x] JWT token expiration (7 days)
- [x] SameSite='strict' on all cookies
- [x] Email format validation
- [x] OTP format strict validation (6 digits)
- [x] Input length limits
- [x] Cookie maxAge set
- [x] Proper HTTP status codes
- [x] Type checking on inputs
- [ ] Rate limiting (TODO)
- [ ] CSRF protection (TODO)
- [ ] Helmet.js headers (TODO)
- [ ] Input sanitization (TODO)
- [ ] Audit logging (TODO)
- [ ] Secrets rotation policy (TODO)

---

## Quick Start

1. **Copy .env.example to .env**
```bash
cp .env.example .env
```

2. **Generate strong secrets**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Update .env with values**
```env
JWT_KEY=<generated-string>
COOKIE_SECRET=<generated-string>
NODE_ENV=production
```

4. **Test authentication flow**
- Sign up with valid email
- Verify OTP arrives and works
- Login with email/username
- Verify token is set and valid

---

## Testing Commands

```bash
# Test signup validation
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "name": "Test", "username": "test"}'

# Test OTP format validation
curl -X POST http://localhost:3000/verifyOtp \
  -H "Content-Type: application/json" \
  -b "userid=..." \
  -d '{"otp": "abc123"}'  # Should fail

# Test token expiry
# Wait 7+ days after login, token should be invalid
```

---

Last Updated: 2026-03-15
Current Risk Level: **MEDIUM** (requires rate limiting + CSRF before production)
