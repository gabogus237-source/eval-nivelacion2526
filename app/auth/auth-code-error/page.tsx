export default function AuthCodeErrorPage() {
  return (
    <div>
      <h1>Error de autenticación</h1>
      <p>
        No se pudo completar el inicio de sesión. Esto suele ocurrir si el enlace expiró
        o si la URL de redirección no está permitida en Supabase.
      </p>
      <p>
        <a href="/login">Volver a Login</a>
      </p>
    </div>
  );
}
