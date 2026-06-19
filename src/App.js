import { useState, useEffect } from "react";
import "./index.css";

// ── Same Supabase DB as studio CRM, but NO Auth ───────────────────────
// We query the customers table directly using the anon key (read-only)
const SB_URL = "https://utctflrqhjzxhzyuhsnn.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Y3RmbHJxaGp6eGh6eXVoc25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Mzg0MzYsImV4cCI6MjA5NjMxNDQzNn0.9RC2YnbSnvtWN5EmyzSxuXvzpgV4a-A3YU6iwDBgKhY";

// Direct DB query — no auth tokens, no OAuth, no redirects
const query = async (filter) => {
  const res = await fetch(
    `${SB_URL}/rest/v1/customers?${filter}&select=*`,
    { headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } }
  );
  if (!res.ok) throw new Error("Connection failed");
  return res.json();
};

// ── Parse DB row ──────────────────────────────────────────────────────
const fromRow = (r) => ({
  id:                r.id,
  name:              r.name               || "",
  email:             r.email              || "",
  phone:             r.phone              || "",
  address:           r.address            || "",
  status:            r.status             || "Lead",
  projectType:       r.project_type       || "Residential",
  budget:            r.budget             || "",
  timeline:          r.timeline           || "",
  startDate:         r.start_date         || "",
  style:             r.style              || "",
  notes:             r.notes              || "",
  rooms:             Array.isArray(r.rooms) ? r.rooms : (r.rooms ? JSON.parse(r.rooms) : []),
  quotation:         r.quotation          != null ? String(r.quotation)          : "",
  previousQuotation: r.previous_quotation != null ? String(r.previous_quotation) : "",
  revisedQuotation:  r.revised_quotation  != null ? String(r.revised_quotation)  : "",
  rebateType:        r.rebate_type        || "amount",
  rebateValue:       r.rebate_value       != null ? String(r.rebate_value) : "",
  referralCode:      r.referral_code      || "",
  clientAccessCode:  r.client_access_code || "",
  roomMaterials:     r.room_materials     ? (typeof r.room_materials === "string" ? JSON.parse(r.room_materials) : r.room_materials) : {},
  roomDetails:       r.room_details       ? (typeof r.room_details   === "string" ? JSON.parse(r.room_details)   : r.room_details)   : {},
  clientSignatures:  r.client_signatures  ? (typeof r.client_signatures === "string" ? JSON.parse(r.client_signatures) : r.client_signatures) : null,
});

const fmt = (n) => {
  if (!n) return "\u2014";
  const num = parseFloat(String(n).replace(/,/g,""));
  if (isNaN(num)) return "\u2014";
  return "\u20b9" + num.toLocaleString("en-IN");
};

const MATERIAL_LABELS = {
  plywood:"Plywood", laminate:"Laminate", hardware:"Hardware",
  glass:"Glass/Mirror", ceiling:"Ceiling Board", lights:"Ceiling Lights", handles:"Handles",
};
const BADGE_CLASS = {
  Lead:"badge badge-lead", Active:"badge badge-active",
  "In Progress":"badge badge-inprogress", Completed:"badge badge-completed",
  "On Hold":"badge badge-onhold",
};
const STEPS = ["Lead","Active","In Progress","Completed"];

// ── Glow Orbs ─────────────────────────────────────────────────────────
const Orbs = () => (
  <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
    <div className="orb" style={{top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(10,100,255,0.35) 0%,transparent 65%)"}}/>
    <div className="orb" style={{top:"10%",right:"-15%",width:"55%",height:"55%",background:"radial-gradient(ellipse,rgba(120,40,220,0.28) 0%,transparent 65%)"}}/>
    <div className="orb" style={{bottom:"-15%",left:"25%",width:"50%",height:"45%",background:"radial-gradient(ellipse,rgba(0,130,190,0.18) 0%,transparent 65%)"}}/>
  </div>
);

// ── Login ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email,   setEmail]   = useState("");
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !code.trim()) {
      setError("Please enter your email and access code");
      return;
    }
    setLoading(true); setError("");
    try {
      // Step 1: Find customer by email
      const rows = await query(`email=eq.${encodeURIComponent(email.trim().toLowerCase())}`);
      if (!rows || rows.length === 0) {
        setError("No project found for this email. Contact High Rise Interiors.");
        setLoading(false); return;
      }
      const customer = fromRow(rows[0]);

      // Step 2: Verify access code (case-insensitive)
      const enteredCode = code.trim().toUpperCase();
      const storedCode  = (customer.clientAccessCode || "").toUpperCase();

      if (!storedCode) {
        setError("Access not set up yet. Contact High Rise Interiors.");
        setLoading(false); return;
      }
      if (enteredCode !== storedCode) {
        setError("Incorrect access code. Please check and try again.");
        setLoading(false); return;
      }

      // Step 3: Login success
      onLogin({ customer });

    } catch (e) {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(160deg,#0D1B3E 0%,#060812 45%,#1A0D2E 100%)",
      position:"relative",padding:20}}>
      <Orbs/>
      <div className="glass fade-in" style={{width:"100%",maxWidth:400,padding:"40px 32px",position:"relative",zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:60,height:60,borderRadius:18,margin:"0 auto 14px",
            background:"linear-gradient(135deg,#0A84FF,#BF5AF2)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:26,fontWeight:800,color:"#fff",
            boxShadow:"0 0 28px rgba(10,132,255,0.5)"}}>H</div>
          <div style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:-0.3}}>
            High Rise Interiors
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:5,
            letterSpacing:2.5,textTransform:"uppercase"}}>Client Portal</div>
        </div>

        {/* Email */}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:10,letterSpacing:1.5,color:"rgba(255,255,255,0.5)",
            textTransform:"uppercase",marginBottom:7,display:"block",fontWeight:600}}>
            Email Address
          </label>
          <input className="glass-input" type="email"
            placeholder="your@email.com"
            value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
        </div>

        {/* Access code */}
        <div style={{marginBottom:24}}>
          <label style={{fontSize:10,letterSpacing:1.5,color:"rgba(255,255,255,0.5)",
            textTransform:"uppercase",marginBottom:7,display:"block",fontWeight:600}}>
            Access Code
          </label>
          <input className="glass-input" type="text"
            placeholder="e.g. HRI-1234"
            value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{letterSpacing:3,fontWeight:700,fontSize:16}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:6}}>
            Access code provided by High Rise Interiors Studio
          </div>
        </div>

        {error && (
          <div style={{background:"rgba(255,69,58,0.15)",border:"1px solid rgba(255,69,58,0.35)",
            borderRadius:10,padding:"10px 14px",fontSize:13,color:"#FF453A",marginBottom:16}}>
            {error}
          </div>
        )}

        <button className="pill pill-primary" onClick={handleLogin} disabled={loading}
          style={{width:"100%",padding:"13px",fontSize:15,fontWeight:700,
            opacity:loading?0.6:1,cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Verifying\u2026" : "View My Project"}
        </button>

        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:"rgba(255,255,255,0.25)"}}>
          Access code shared by your interior designer
        </div>
      </div>
    </div>
  );
}

// ── Project Timeline ──────────────────────────────────────────────────
function Timeline({ status }) {
  const idx = STEPS.indexOf(status);
  return (
    <div style={{display:"flex",alignItems:"center",marginTop:16}}>
      {STEPS.map((s,i) => {
        const done=i<idx, cur=i===idx;
        const col = cur?"#0A84FF":done?"#30D158":"rgba(255,255,255,0.2)";
        return (
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"auto"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:28,height:28,borderRadius:"50%",
                background:cur?"rgba(10,132,255,0.2)":done?"rgba(48,209,88,0.15)":"rgba(255,255,255,0.05)",
                border:`2px solid ${col}`,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:11,color:col,fontWeight:700}}>
                {done?"\u2713":cur?"\u25cf":"\u25cb"}
              </div>
              <div style={{fontSize:9,color:col,fontWeight:cur?700:400,
                letterSpacing:0.5,whiteSpace:"nowrap"}}>{s}</div>
            </div>
            {i<STEPS.length-1 && (
              <div style={{flex:1,height:2,margin:"0 4px",marginBottom:16,
                background:done?"#30D158":"rgba(255,255,255,0.1)",borderRadius:1}}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Client Report (print-friendly white page) ─────────────────────────
function Report({ client, onClose }) {
  const today = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  const getDocTerm = s => (!s||s==="Lead")?"Quotation":"Order";
  const base   = parseFloat(client.quotation)||0;
  const rebate = client.rebateValue
    ? (client.rebateType==="percent"
        ? Math.round(base*parseFloat(client.rebateValue)/100)
        : parseFloat(client.rebateValue))
    : 0;
  const final = base - rebate;

  return (
    <div style={{minHeight:"100vh",background:"#fff",
      fontFamily:"'DM Sans',system-ui,sans-serif",color:"#0F1923",paddingBottom:60}}>
      <style>{`@media print{.np{display:none!important}}`}</style>

      {/* Toolbar */}
      <div className="np" style={{background:"#060812",padding:"12px 32px",
        display:"flex",gap:12,alignItems:"center",borderBottom:"3px solid #0A84FF"}}>
        <button className="pill" onClick={onClose}>\u2190 Back to Dashboard</button>
        <button className="pill pill-primary" onClick={()=>window.print()}>
          \ud83d\uddb4 Print / Save PDF
        </button>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginLeft:"auto"}}>
          Tip: Save as PDF in print dialog
        </span>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"40px 48px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
          borderBottom:"2px solid #0A84FF",paddingBottom:20,marginBottom:28}}>
          <div>
            <div style={{fontSize:28,fontWeight:800,color:"#0A84FF",letterSpacing:-1,marginBottom:4}}>
              HIGH RISE INTERIORS
            </div>
            <div style={{fontSize:12,color:"#6b7280"}}>Hyderabad, Telangana, India</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:18,fontWeight:700,color:"#d1d5db",letterSpacing:3}}>
              CLIENT REPORT
            </div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:6}}>{today}</div>
          </div>
        </div>

        {/* Client + Project */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,marginBottom:28}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              Client Details
            </div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{client.name}</div>
            {[["\ud83d\udccd",client.address],["\ud83d\udcde",client.phone],["\ud83d\udce7",client.email]]
              .filter(([,v])=>v).map(([ic,v])=>(
              <div key={ic} style={{fontSize:13,color:"#374151",marginBottom:4}}>{ic} {v}</div>
            ))}
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              Project Details
            </div>
            {[["Type",client.projectType],["Style",client.style],
              ["Start",client.startDate],["Timeline",client.timeline],
              ["Status",client.status]]
              .filter(([,v])=>v).map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:8,fontSize:13,marginBottom:6}}>
                <span style={{color:"#6b7280",minWidth:72}}>{l}:</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms */}
        {client.rooms?.length>0 && (
          <div style={{marginBottom:28}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              Scope \u2014 Rooms Covered
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {client.rooms.map(r=>(
                <span key={r} style={{background:"#e0e7ff",color:"#3730a3",
                  padding:"4px 14px",borderRadius:100,fontSize:11,fontWeight:700,
                  letterSpacing:1,textTransform:"uppercase"}}>{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Room Dimensions */}
        {client.roomDetails && Object.keys(client.roomDetails).length>0 && (
          <div style={{marginBottom:28}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              Room Dimensions
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#1e293b"}}>
                {["Room","L (ft)","W (ft)","H (ft)","Area"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",fontSize:9,fontWeight:700,
                    letterSpacing:1.5,textTransform:"uppercase",color:"#fff",textAlign:"left"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {Object.entries(client.roomDetails).map(([room,rd],i)=>{
                  const area = rd.length&&rd.width
                    ? (parseFloat(rd.length)*parseFloat(rd.width)).toFixed(0)+" sq ft" : "\u2014";
                  return (
                    <tr key={room} style={{background:i%2===0?"#fff":"#f8f9fa"}}>
                      {[`\ud83c\udfe0 ${room}`,rd.length||"\u2014",rd.width||"\u2014",rd.height||"\u2014",area].map((v,j)=>(
                        <td key={j} style={{padding:"9px 12px",fontSize:12,
                          borderBottom:"1px solid #e5e7eb",fontWeight:j===0?600:400}}>{v}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Materials */}
        {client.roomMaterials && Object.keys(client.roomMaterials).length>0 && (
          <div style={{marginBottom:28}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              Material Specifications
            </div>
            {Object.entries(client.roomMaterials).map(([room,mats])=>{
              const entries = Object.entries(mats).filter(([,v])=>v?.name);
              if (!entries.length) return null;
              return (
                <div key={room} style={{marginBottom:14,border:"1px solid #e5e7eb",
                  borderRadius:4,overflow:"hidden"}}>
                  <div style={{background:"#1e293b",padding:"8px 14px"}}>
                    <span style={{color:"#fff",fontWeight:700,fontSize:13}}>
                      \ud83c\udfe0 {room}
                    </span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 3fr 1fr",
                    padding:"5px 14px",background:"#374151",
                    fontSize:9,fontWeight:700,letterSpacing:1.5,color:"#aaa",textTransform:"uppercase"}}>
                    <span>Category</span><span>Brand</span><span>Qty</span>
                  </div>
                  {entries.map(([mt,sel],i)=>(
                    <div key={mt} style={{display:"grid",gridTemplateColumns:"2fr 3fr 1fr",
                      padding:"8px 14px",background:i%2===0?"#fff":"#f9fafb",
                      borderTop:"1px solid #e5e7eb"}}>
                      <div style={{fontSize:11,color:"#6b7280",fontWeight:700,
                        textTransform:"uppercase",letterSpacing:1}}>
                        {MATERIAL_LABELS[mt]||mt}
                      </div>
                      <div style={{fontSize:12,fontWeight:600,color:"#0F1923"}}>{sel.name}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{sel.qty}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Quotation */}
        {client.quotation && (
          <div style={{marginBottom:28}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              {getDocTerm(client.status)} Summary
            </div>
            {client.referralCode && (
              <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,
                padding:"14px 18px",marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#15803d",letterSpacing:1,marginBottom:4}}>
                  \ud83c\udf81 YOUR REFERRAL CODE
                </div>
                <div style={{fontSize:22,fontWeight:800,color:"#16a34a",letterSpacing:3}}>
                  {client.referralCode}
                </div>
                <div style={{fontSize:12,color:"#166534",marginTop:6}}>
                  Share with friends for 5% off their project
                </div>
              </div>
            )}
            {client.previousQuotation && (
              <div style={{display:"flex",justifyContent:"space-between",
                padding:"8px 0",borderBottom:"1px solid #e5e7eb",fontSize:13}}>
                <span style={{color:"#6b7280"}}>Previous {getDocTerm(client.status)}</span>
                <span style={{textDecoration:"line-through",color:"#9ca3af"}}>
                  {fmt(client.previousQuotation)}
                </span>
              </div>
            )}
            {rebate>0 && (
              <div style={{display:"flex",justifyContent:"space-between",
                padding:"8px 0",borderBottom:"1px solid #e5e7eb",fontSize:13}}>
                <span style={{color:"#6b7280"}}>Discount</span>
                <span style={{color:"#dc2626"}}>\u2212 {fmt(rebate)}</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",background:"#1e293b",
              color:"#fff",padding:"14px 18px",borderRadius:8,marginTop:10,fontWeight:700,fontSize:16}}>
              <span>Final {getDocTerm(client.status)}</span>
              <span style={{color:"#34d399"}}>{fmt(final||client.quotation)}</span>
            </div>
          </div>
        )}

        {/* Signatures */}
        {client.clientSignatures && (
          <div style={{marginBottom:28}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,color:"#0A84FF",
              borderBottom:"2px solid #0A84FF",paddingBottom:6,marginBottom:14,textTransform:"uppercase"}}>
              Signatures
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              {[["Client Signature","client"],["Studio Signature","hri"]].map(([label,key])=>(
                <div key={key} style={{borderTop:"2px solid #e5e7eb",paddingTop:12}}>
                  {client.clientSignatures[key]
                    ? <img src={client.clientSignatures[key]} alt={label}
                        style={{maxHeight:60,maxWidth:"100%",marginBottom:8}}/>
                    : <div style={{height:60,background:"#f9fafb",borderRadius:4,marginBottom:8}}/>
                  }
                  <div style={{fontSize:11,color:"#6b7280"}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{borderTop:"1px solid #e5e7eb",paddingTop:16,
          display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af"}}>
          <span>High Rise Interiors Studio \u00b7 Hyderabad</span>
          <span>Generated {today}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────
function Dashboard({ session, onLogout }) {
  const { customer } = session;
  const [view,   setView]   = useState("home");
  const [client, setClient] = useState(customer);

  // Refresh latest data on mount
  useEffect(()=>{
    query(`id=eq.${client.id}`).then(rows=>{
      if (rows?.length) setClient(fromRow(rows[0]));
    }).catch(()=>{});
  },[]);

  if (view==="report") return <Report client={client} onClose={()=>setView("home")}/>;

  const pct = (()=>{
    const i = STEPS.indexOf(client.status);
    return i<0 ? 0 : Math.round((i+1)/STEPS.length*100);
  })();

  return (
    <div style={{minHeight:"100vh",
      background:"linear-gradient(160deg,#0D1B3E 0%,#060812 45%,#1A0D2E 100%)",
      position:"relative"}}>
      <Orbs/>

      {/* Nav */}
      <div className="portal-nav" style={{height:54,padding:"0 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:9,flexShrink:0,
            background:"linear-gradient(135deg,#0A84FF,#BF5AF2)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:13,fontWeight:800,color:"#fff",
            boxShadow:"0 0 14px rgba(10,132,255,0.5)"}}>H</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>High Rise Interiors</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",letterSpacing:2,
              textTransform:"uppercase"}}>Client Portal</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.45)",
            maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {client.name}
          </span>
          <button className="pill" onClick={onLogout}
            style={{padding:"6px 14px",fontSize:12}}>Sign Out</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px 80px",
        position:"relative",zIndex:1}}>

        {/* Welcome */}
        <div className="slide-up" style={{marginBottom:22}}>
          <div style={{fontSize:26,fontWeight:700,color:"#fff",letterSpacing:-0.5,marginBottom:4}}>
            Welcome, {client.name.split(" ")[0]} \ud83d\udc4b
          </div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.45)"}}>
            Your project at High Rise Interiors
          </div>
        </div>

        {/* Status card */}
        <div className="glass slide-up" style={{padding:"22px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:4}}>{client.name}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.45)"}}>
                {client.projectType}{client.style?" \u00b7 "+client.style:""}
              </div>
            </div>
            <span className={BADGE_CLASS[client.status]||"badge"}>{client.status}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",
            fontSize:10,color:"rgba(255,255,255,0.4)",marginBottom:5}}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
            <div style={{height:"100%",width:`${pct}%`,
              background:"linear-gradient(90deg,#0A84FF,#BF5AF2)",
              borderRadius:3,transition:"width 0.6s ease"}}/>
          </div>
          <Timeline status={client.status}/>
        </div>

        {/* Info grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="glass slide-up" style={{padding:"18px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.5)",
              textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,0.1)",
              paddingBottom:7,marginBottom:12}}>Contact</div>
            {[["\ud83d\udcde",client.phone],["\ud83d\udce7",client.email],
              ["\ud83d\udccd",client.address]].filter(([,v])=>v).map(([ic,v])=>(
              <div key={ic} className="info-row">
                <span style={{color:"rgba(255,255,255,0.4)",marginRight:8}}>{ic}</span>
                <span style={{fontSize:13,wordBreak:"break-all"}}>{v}</span>
              </div>
            ))}
          </div>
          <div className="glass slide-up" style={{padding:"18px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.5)",
              textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,0.1)",
              paddingBottom:7,marginBottom:12}}>Project</div>
            {[["Start",client.startDate],["Duration",client.timeline],
              ["Budget",client.budget]].filter(([,v])=>v).map(([l,v])=>(
              <div key={l} className="info-row">
                <span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{l}</span>
                <span style={{fontSize:13,fontWeight:500}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms */}
        {client.rooms?.length>0 && (
          <div className="glass slide-up" style={{padding:"18px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.5)",
              textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,0.1)",
              paddingBottom:7,marginBottom:12}}>Rooms Covered</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {client.rooms.map(r=>(
                <span key={r} style={{background:"rgba(10,132,255,0.15)",color:"#0A84FF",
                  border:"1px solid rgba(10,132,255,0.35)",padding:"5px 14px",
                  borderRadius:100,fontSize:12,fontWeight:600}}>\ud83c\udfe0 {r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Quotation */}
        {client.quotation && (
          <div className="glass slide-up" style={{padding:"18px",marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"rgba(255,255,255,0.5)",
              textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,0.1)",
              paddingBottom:7,marginBottom:12}}>
              {(!client.status||client.status==="Lead")?"Quotation":"Order"}
            </div>
            {client.previousQuotation && (
              <div className="info-row">
                <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Previous</span>
                <span style={{textDecoration:"line-through",color:"rgba(255,255,255,0.35)",fontSize:13}}>
                  {fmt(client.previousQuotation)}
                </span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",marginTop:10,paddingTop:8}}>
              <span style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>
                Final Amount
              </span>
              <span style={{fontSize:22,fontWeight:700,color:"#30D158",letterSpacing:-0.5}}>
                {fmt(client.quotation)}
              </span>
            </div>
          </div>
        )}

        {/* Referral */}
        {client.referralCode && (
          <div className="glass slide-up" style={{padding:"18px",marginBottom:12,
            background:"rgba(48,209,88,0.08)",borderColor:"rgba(48,209,88,0.3)"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#30D158",letterSpacing:1,marginBottom:6}}>
              \ud83c\udf81 YOUR REFERRAL CODE
            </div>
            <div style={{fontSize:26,fontWeight:800,color:"#30D158",letterSpacing:4,marginBottom:5}}>
              {client.referralCode}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>
              Share with friends \u2014 they get 5% off, you earn cashback!
            </div>
          </div>
        )}

        {/* View Report */}
        <div className="glass slide-up" style={{padding:"18px",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:"#fff",marginBottom:3}}>
              \ud83d\udcc4 Project Report
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>
              Full summary with materials \u2014 printable PDF
            </div>
          </div>
          <button className="pill pill-primary"
            onClick={()=>setView("report")}
            style={{padding:"10px 22px",fontSize:13,flexShrink:0}}>
            View Report \u2192
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(()=>{
    try { const s=localStorage.getItem("hri_client"); return s?JSON.parse(s):null; }
    catch { return null; }
  });

  const handleLogin  = (s) => { localStorage.setItem("hri_client",JSON.stringify(s)); setSession(s); };
  const handleLogout = ()  => { localStorage.removeItem("hri_client"); setSession(null); };

  if (!session) return <LoginPage onLogin={handleLogin}/>;
  return <Dashboard session={session} onLogout={handleLogout}/>;
}
