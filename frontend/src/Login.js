import { useState } from "react";
import axios from "axios";
import "./App.css";

function Login({ setToken, goToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/auth/login",
        new URLSearchParams({ username: email, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      localStorage.setItem("token", response.data.access_token);
      setToken(response.data.access_token);
    } catch (error) {
      alert("Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 30%, rgba(255,215,225,0.7) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(254,224,231,0.5) 0%, transparent 50%), #F9F9F9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Floating blobs */}
      <div style={{ position:"fixed", top:"10%", left:"5%", width:"300px", height:"300px", borderRadius:"50%", background:"rgba(255,215,225,0.3)", filter:"blur(60px)", animation:"blobFloat 8s ease-in-out infinite", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"10%", right:"5%", width:"250px", height:"250px", borderRadius:"50%", background:"rgba(254,224,231,0.3)", filter:"blur(50px)", animation:"blobFloat 10s ease-in-out infinite reverse", pointerEvents:"none", zIndex:0 }} />

      <style>{`
        @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.05)} 66%{transform:translate(-10px,10px) scale(0.95)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(40px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes logoSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .auth-input { width:100%; padding:14px 18px; border:1.5px solid #FFD7E1; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; color:#2D1B22; background:white; outline:none; transition:all 0.3s; }
        .auth-input:focus { border-color:#E8758A; box-shadow:0 0 0 4px rgba(232,117,138,0.15); }
        .auth-btn { width:100%; padding:15px; background:linear-gradient(135deg,#E8758A,#C4506A); color:white; border:none; border-radius:50px; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; cursor:pointer; transition:all 0.4s cubic-bezier(0.25,0.46,0.45,0.94); box-shadow:0 8px 25px rgba(232,117,138,0.3); letter-spacing:0.3px; }
        .auth-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 15px 40px rgba(196,80,106,0.4); }
        .auth-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .auth-link { background:none; border:none; color:#E8758A; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; text-decoration:underline; padding:0; }
        .pass-toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:16px; color:#B08090; }
      `}</style>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"420px", animation:"cardIn 0.7s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ width:"64px", height:"64px", background:"linear-gradient(135deg,#E8758A,#C4506A)", borderRadius:"20px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"30px", margin:"0 auto 16px", boxShadow:"0 8px 30px rgba(232,117,138,0.4)" }}>🌸</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:600, background:"linear-gradient(135deg,#C4506A,#E8758A)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>BlushBasket</div>
          <div style={{ fontSize:"11px", color:"#B08090", letterSpacing:"2px", textTransform:"uppercase", marginTop:"4px" }}>Beauty & Skincare</div>
        </div>

        {/* Card */}
        <div style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(20px)", borderRadius:"24px", padding:"40px", boxShadow:"0 20px 60px rgba(200,80,100,0.15)", border:"1px solid rgba(255,215,225,0.4)" }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"28px", fontWeight:400, color:"#2D1B22", marginBottom:"8px", letterSpacing:"-0.5px" }}>Welcome back</h2>
          <p style={{ fontSize:"14px", color:"#B08090", marginBottom:"28px", fontWeight:300 }}>Sign in to your account to continue</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:"16px" }}>
              <label style={{ display:"block", fontSize:"12px", fontWeight:500, color:"#7A4E5C", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"6px" }}>Email Address</label>
              <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom:"24px" }}>
              <label style={{ display:"block", fontSize:"12px", fontWeight:500, color:"#7A4E5C", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"6px" }}>Password</label>
              <div style={{ position:"relative" }}>
                <input className="auth-input" type={showPass ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight:"44px" }} />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>{showPass ? "🙈" : "👁️"}</button>
              </div>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In ✨"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:"20px", fontSize:"14px", color:"#B08090" }}>
            Don't have an account?{" "}
            <button className="auth-link" onClick={goToRegister}>Create one</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
