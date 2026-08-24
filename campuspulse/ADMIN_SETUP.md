# CampusPulse Admin Setup

The bundled admin creation script is configured with the requested local admin credentials:

- Email: `kg86189@gmail.com`
- Password: `Ramkola@123`

From the `server` directory run:

```powershell
npm install
npm run admin:create
```

The script creates the account with `role: admin` in the existing MongoDB database.

If the account already exists, the script will report that the email already exists; it will not create a duplicate account.
