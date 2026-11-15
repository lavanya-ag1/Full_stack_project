import Navbar from "../components/Navbar";
import SignupForm from "../components/SignupForm";

function Signup() {
  return (
    <div className="login-page">
      <Navbar />
      <div className="login-page-content">
        <SignupForm />
      </div>
    </div>
  );
}

export default Signup;
