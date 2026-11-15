import Navbar from "../components/Navbar";
import LoginForm from "../components/LoginForm";

function Login() {
  return (
    <div className="login-page">
      <Navbar />
      <div className="login-page-content">
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;
