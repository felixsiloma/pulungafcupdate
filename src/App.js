import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  Home,
  Users,
  Calendar,
  ShieldAlert,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Image,
  X,
  Check,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [email, setEmail] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  // SANDPACK STYLE INJECTOR HACK: Forces the browser preview to load colors and animations instantly
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://unpkg.com@^2/dist/tailwind.min.css";
    link.rel = "stylesheet";
    const fonts = document.createElement("link");
    fonts.href = "https://googleapis.com&display=swap";
    fonts.rel = "stylesheet";
    document.head.appendChild(link);
    document.head.appendChild(fonts);
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(fonts)) document.head.removeChild(fonts);
    };
  }, []);
  // Application Primary Synchronized Arrays
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [bgPhoto, setBgPhoto] = useState("");
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Registration and Authentication Form Managers
  const [isRegistering, setIsRegistering] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPin, setRegPin] = useState("");

  // Theater State Lightbox variables
  const [selectedTheaterImage, setSelectedTheaterImage] = useState(null);
  // Scoreboard Creation Box States
  const [homeTeam, setHomeTeam] = useState("Pulunga FC");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [selectedScorer, setSelectedScorer] = useState("");
  const [selectedAssister, setSelectedAssister] = useState("");
  const [editingMatchId, setEditingMatchId] = useState(null);

  // Player Grid Form States
  const [pName, setPName] = useState("");
  const [pPos, setPPos] = useState("");
  const [pNum, setPNum] = useState("");
  const [pContact, setPContact] = useState("");
  const [pPhoto, setPPhoto] = useState("");
  const [editingPlayerId, setEditingPlayerId] = useState(null);

  // Scheduling Event Form States
  const [sType, setSType] = useState("Training");
  const [sDate, setSDate] = useState("");
  const [sTime, setSTime] = useState("");

  // 4-Digit Security PIN Validation Mask
  const handlePinFilter = (value, setter) => {
    if (/^\d*$/.test(value) && value.length <= 4) {
      setter(value);
    }
  };
  useEffect(() => {
    // 1. Authorization Watcher enforcing the strict 3-admin rule
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : "player";

        if (role === "admin") {
          const adminQuery = query(
            collection(db, "users"),
            where("role", "==", "admin")
          );
          const adminSnapshot = await getDocs(adminQuery);
          const adminIds = adminSnapshot.docs.map((d) => d.id);

          if (adminSnapshot.size > 3 && !adminIds.includes(currentUser.uid)) {
            setError(
              "Access Denied: The strict system limit of 3 Administrators has been reached."
            );
            signOut(auth);
            return;
          }
        }
        setUser(currentUser);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    // 2. Wallpaper themes snapshot hook listener
    const unsubscribeTheme = onSnapshot(doc(db, "config", "theme"), (doc) => {
      if (doc.exists()) setBgPhoto(doc.data().bgPhoto);
    });

    // 3. Scoreboard entries grid hook listener
    const unsubscribeMatches = onSnapshot(collection(db, "matches"), (snap) => {
      const mList = [];
      snap.forEach((doc) => mList.push({ id: doc.id, ...doc.data() }));
      setMatches(mList);
    });
    // 4. Roster player lists dataset grid hook
    const unsubscribePlayers = onSnapshot(collection(db, "players"), (snap) => {
      const pList = [];
      snap.forEach((doc) => pList.push({ id: doc.id, ...doc.data() }));
      setPlayers(pList);
    });

    // 5. Training schedules calendar log framework sync hook
    const unsubscribeSchedules = onSnapshot(
      collection(db, "schedules"),
      (snap) => {
        const sList = [];
        snap.forEach((doc) => sList.push({ id: doc.id, ...doc.data() }));
        setSchedules(sList);
      }
    );

    // 6. Live Match Photo Media Gallery framework sync hook
    const unsubscribeGallery = onSnapshot(collection(db, "gallery"), (snap) => {
      const gList = [];
      snap.forEach((doc) => gList.push({ id: doc.id, ...doc.data() }));
      setGallery(gList.sort((a, b) => b.timestamp - a.timestamp));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTheme();
      unsubscribeMatches();
      unsubscribePlayers();
      unsubscribeSchedules();
      unsubscribeGallery();
    };
  }, []);
  // MATHEMATICAL SORTING ENGINE: Resolves active lineups by session participation variables
  const totalTrainings = schedules.filter((s) => s.type === "Training").length;
  const computedPlayers = players.map((p) => {
    const attended = schedules.filter(
      (s) => s.type === "Training" && s.attendedPlayers?.includes(p.name)
    ).length;
    const pct =
      totalTrainings > 0 ? Math.round((attended / totalTrainings) * 100) : 0;
    return { ...p, attendancePct: pct };
  });

  const sortedSquad = [...computedPlayers].sort(
    (a, b) => b.attendancePct - a.attendancePct
  );
  const startingEleven = sortedSquad.slice(0, 11);

  // Career Metrics Aggregation Leaderboards
  const topScorer = [...players].sort(
    (a, b) => (b.goals || 0) - (a.goals || 0)
  )[0];
  const topAssister = [...players].sort(
    (a, b) => (b.assists || 0) - (a.assists || 0)
  )[0];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (passwordInput.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    const systemPassword = `${passwordInput}00`;
    try {
      await signInWithEmailAndPassword(auth, email, systemPassword);
    } catch {
      setError(
        "Invalid account email address or incorrect portal security PIN."
      );
    }
  };
  const handlePlayerSignUpSubmission = async (e) => {
    e.preventDefault();
    setError("");
    if (regPin.length !== 4) {
      setError("Your chosen security PIN must be exactly 4 digits.");
      return;
    }
    const secureSystemPassword = `${regPin}00`;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        regEmail,
        secureSystemPassword
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: regEmail,
        name: regName,
        role: "player",
      });
      await addDoc(collection(db, "players"), {
        name: regName,
        position: "Unassigned",
        jerseyNumber: 0,
        goals: 0,
        assists: 0,
        contact: "",
        photoUrl: "",
      });
      alert("Account Created! You are now authorized on the squad list.");
      setIsRegistering(false);
      setRegEmail("");
      setRegName("");
      setRegPin("");
    } catch (err) {
      setError("Sign Up Failed: " + err.message);
    }
  };

  const handleUploadPhotoWallpaper = async (e) => {
    if (userRole !== "admin") return;
    const file = e.target.files[0];
    if (!file) return;
    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      await setDoc(
        doc(db, "config", "theme"),
        { bgPhoto: fileReader.result },
        { merge: true }
      );
      alert("Global theme wallpaper updated across all devices successfully!");
    };
    fileReader.readAsDataURL(file);
  };
  const handleSaveMatchResult = async (e) => {
    e.preventDefault();
    if (userRole !== "admin") return;
    const payload = {
      homeTeam,
      awayTeam,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      timestamp: Date.now(),
    };

    if (editingMatchId) {
      await updateDoc(doc(db, "matches", editingMatchId), payload);
      setEditingMatchId(null);
    } else {
      await addDoc(collection(db, "matches"), payload);
    }

    if (selectedScorer) {
      const r = doc(db, "players", selectedScorer);
      const d = await getDoc(r);
      await updateDoc(r, { goals: (d.data().goals || 0) + 1 });
    }
    if (selectedAssister) {
      const r = doc(db, "players", selectedAssister);
      const d = await getDoc(r);
      await updateDoc(r, { assists: (d.data().assists || 0) + 1 });
    }
    setAwayTeam("");
    setHomeScore("");
    setAwayScore("");
    setSelectedScorer("");
    setSelectedAssister("");
  };

  const handleSavePlayerProfile = async (e) => {
    e.preventDefault();
    if (userRole !== "admin") return;
    const data = {
      name: pName,
      position: pPos,
      jerseyNumber: Number(pNum),
      contact: pContact,
      photoUrl: pPhoto,
    };

    if (editingPlayerId) {
      await updateDoc(doc(db, "players", editingPlayerId), data);
      setEditingPlayerId(null);
    } else {
      await addDoc(collection(db, "players"), {
        ...data,
        goals: 0,
        assists: 0,
      });
    }
    setPName("");
    setPPos("");
    setPNum("");
    setPContact("");
    setPPhoto("");
  };
  const handleUploadGalleryImage = async (e) => {
    if (userRole !== "admin") return;
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onloadend = async () => {
      try {
        await addDoc(collection(db, "gallery"), {
          imageUrl: fileReader.result,
          caption: "Pulunga FC In Action",
          timestamp: Date.now(),
        });
        alert("Match photo added to the live team stream successfully!");
      } catch (err) {
        alert("Image storage failed: " + err.message);
      }
    };
    fileReader.readAsDataURL(file);
  };

  const handleDeleteGalleryImage = async (id) => {
    if (userRole !== "admin") return;
    if (
      window.confirm(
        "Are you sure you want to remove this photo from the team stream?"
      )
    ) {
      await deleteDoc(doc(db, "gallery", id));
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (userRole !== "admin") return;
    await addDoc(collection(db, "schedules"), {
      type: sType,
      date: sDate,
      time: sTime,
      attendedPlayers: [],
    });
    setSType("Training");
    setSDate("");
    setSTime("");
  };

  const toggleAttendanceSheet = async (id, name) => {
    if (userRole !== "admin") return;
    const ref = doc(db, "schedules", id);
    const d = await getDoc(ref);
    let list = d.data().attendedPlayers || [];
    list = list.includes(name)
      ? list.filter((n) => n !== name)
      : [...list, name];
    await updateDoc(ref, { attendedPlayers: list });
  };
  const handleDeleteMatchEntry = async (id) => {
    if (userRole !== "admin") return;
    if (window.confirm("Permanently delete this match result record?")) {
      await deleteDoc(doc(db, "matches", id));
    }
  };

  const handleTriggerMatchEditMode = (m) => {
    setEditingMatchId(m.id);
    setHomeTeam(m.homeTeam);
    setAwayTeam(m.awayTeam);
    setHomeScore(m.homeScore);
    setAwayScore(m.awayScore);
  };

  const handleDeletePlayerProfile = async (id) => {
    if (userRole !== "admin") return;
    if (
      window.confirm("Permanently remove this player from the team directory?")
    ) {
      await deleteDoc(doc(db, "players", id));
    }
  };

  const handleTriggerPlayerEditMode = (p) => {
    setEditingPlayerId(p.id);
    setPName(p.name);
    setPPos(p.position);
    setPNum(p.jerseyNumber);
    setPContact(p.contact);
    setPPhoto(p.photoUrl);
  };

  const handleDeleteScheduleEntry = async (id) => {
    if (userRole !== "admin") return;
    if (window.confirm("Cancel and delete this session log record?")) {
      await deleteDoc(doc(db, "schedules", id));
    }
  };
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form
          onSubmit={isRegistering ? handlePlayerSignUpSubmission : handleLogin}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-gray-800"
        >
          <h2 className="text-2xl font-black text-center text-blue-700 tracking-wide">
            PULUNGA FC
          </h2>
          <p className="text-center text-xs text-gray-400 mb-6 font-medium">
            {isRegistering
              ? "Squad Roster Self-Registration Hub"
              : "Blue & White Hub Authentication"}
          </p>
          {error && (
            <p className="text-red-500 text-xs mb-4 text-center font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
              {error}
            </p>
          )}
          <div className="space-y-3">
            {isRegistering && (
              <input
                type="text"
                placeholder="Full Name (As displayed on Roster)"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none text-sm text-black bg-white"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={isRegistering ? regEmail : email}
              onChange={(e) =>
                isRegistering
                  ? setRegEmail(e.target.value)
                  : setEmail(e.target.value)
              }
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none text-sm text-black bg-white"
              required
            />
            <input
              type="password"
              placeholder="4-Digit PIN"
              value={isRegistering ? regPin : passwordInput}
              onChange={(e) =>
                handlePinFilter(
                  e.target.value,
                  isRegistering ? setRegPin : setPasswordInput
                )
              }
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none text-sm tracking-widest text-center font-bold text-black bg-white"
              maxLength={4}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl mt-4 text-sm uppercase tracking-wider"
          >
            {isRegistering ? "Create Player Profile" : "Enter Portal"}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
              }}
              className="text-xs text-blue-600 font-bold hover:underline focus:outline-none"
            >
              {isRegistering
                ? "Already registered? Log in here"
                : "New player? Create your hub account here"}
            </button>
          </div>
        </form>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen text-white bg-gray-950 bg-cover bg-center flex flex-col font-sans"
      style={{ backgroundImage: bgPhoto ? `url(${bgPhoto})` : "none" }}
    >
      <header className="bg-gray-900 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white font-black tracking-wider text-sm">
            PFC
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-white">
              PULUNGA FC
            </h1>
            <p className="text-xs text-blue-300 font-medium capitalize">
              Portal Access: {userRole || "Player"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <LogOut size={14} /> Exit Hub
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* INTERACTIVE NAVIGATION CONTROL TABS BAR */}
        <nav className="flex gap-1 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 max-w-lg">
          {["Home", "Roster", "Schedules", "Gallery"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
          {activeTab === "Home" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="text-yellow-400 text-xl font-bold">⚽</div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Golden Boot Leader
                    </p>
                    <h4 className="text-base font-black text-white">
                      {topScorer
                        ? `${topScorer.name} (${topScorer.goals || 0} Goals)`
                        : "No entries registered"}
                    </h4>
                  </div>
                </div>
                <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="text-emerald-400 text-xl font-bold">👟</div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Playmaking Leader
                    </p>
                    <h4 className="text-base font-black text-white">
                      {topAssister
                        ? `${topAssister.name} (${
                            topAssister.assists || 0
                          } Assists)`
                        : "No entries registered"}
                    </h4>
                  </div>
                </div>
              </div>

              {/* AUTOMATED STARTING ELEVEN SQUAD INTERFACE */}
              <div className="bg-gray-950 border border-gray-800 p-4 rounded-2xl">
                <h3 className="text-xs font-black tracking-wider text-blue-400 uppercase mb-4">
                  🛡️ Calculated Starting Eleven (Attendance Merit)
                </h3>
                {startingEleven.length === 0 ? (
                  <p className="text-xs text-gray-400 font-medium py-2">
                    No players found in database records.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {startingEleven.map((p, idx) => (
                      <div
                        key={p.id}
                        className="bg-gray-900 border border-gray-800 p-3 rounded-xl text-center relative overflow-hidden"
                      >
                        <span className="absolute top-2 left-2 bg-blue-600 text-white font-mono text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-black text-white mt-4 truncate">
                          {p.name}
                        </h5>
                        <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1">
                          {p.attendancePct}% Attendance
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "Roster" && (
            <div className="space-y-4">
              {userRole === "admin" && (
                <form
                  onSubmit={handleSavePlayerProfile}
                  className="bg-gray-950 border border-gray-800 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-2"
                >
                  <div className="col-span-2 md:col-span-5 text-xs text-blue-400 font-black uppercase flex justify-between items-center">
                    <span>
                      {editingPlayerId
                        ? "✍️ Rewrite Player Profile Profile"
                        : "➕ Add New Squad Registration"}
                    </span>
                    {editingPlayerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlayerId(null);
                          setPName("");
                          setPPos("");
                          setPNum("");
                        }}
                        className="text-red-400 font-bold lowercase text-[10px]"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="bg-gray-900 border border-gray-800 p-2 rounded-xl text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Position"
                    value={pPos}
                    onChange={(e) => setPPos(e.target.value)}
                    className="bg-gray-900 border border-gray-800 p-2 rounded-xl text-xs text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Jersey #"
                    value={pNum}
                    onChange={(e) => setPNum(e.target.value)}
                    className="bg-gray-900 border border-gray-800 p-2 rounded-xl text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Contact Details"
                    value={pContact}
                    onChange={(e) => setPContact(e.target.value)}
                    className="bg-gray-900 border border-gray-800 p-2 rounded-xl text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="col-span-2 md:col-span-1 bg-blue-600 font-bold text-xs rounded-xl p-2 text-white"
                  >
                    {editingPlayerId ? "Update Data" : "Register Player"}
                  </button>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase bg-gray-950">
                      <th className="p-3">Player Name</th>
                      <th className="p-3">Position</th>
                      <th className="p-3 text-center">Jersey</th>
                      <th className="p-3 text-center">Goals</th>
                      <th className="p-3 text-center">Assists</th>
                      {userRole === "admin" && (
                        <th className="p-3 text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {players.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-800/40">
                        <td className="p-3 font-bold text-white">{p.name}</td>
                        <td className="p-3 font-medium text-gray-300">
                          {p.position || "Unassigned"}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-400">
                          {p.jerseyNumber || "-"}
                        </td>
                        <td className="p-3 text-center font-bold text-yellow-400">
                          {p.goals || 0}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400">
                          {p.assists || 0}
                        </td>
                        {userRole === "admin" && (
                          <td className="p-3 text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleTriggerPlayerEditMode(p)}
                              className="p-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md hover:bg-yellow-500 hover:text-black transition"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeletePlayerProfile(p.id)}
                              className="p-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-50 transition"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "Gallery" && (
            <div className="space-y-4">
              <div className="border-b border-blue-800 pb-3">
                <h2 className="text-lg font-black tracking-wide text-white">
                  MATCH PHOTO GALLERY
                </h2>
                <p className="text-xs text-blue-300">
                  Visual logs, tournament captures, and training media.
                </p>
              </div>

              {/* ADMIN NEW PHOTO LOG UPLOADER MODULE */}
              {userRole === "admin" && (
                <div className="bg-blue-900 border border-blue-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-blue-300 font-black uppercase block">
                      📸 Append Match Photo Entry
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Select a match picture from storage to broadcast to the
                      gallery array feed grid.
                    </span>
                  </div>
                  <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-lg transition-all text-center whitespace-nowrap">
                    📁 Choose Photo from Device
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadGalleryItem}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* LIVE REY-RENDERED GRID BLOCKS FEED */}
              {gallery.length === 0 ? (
                <p className="text-xs text-blue-400 font-medium py-8 text-center">
                  No snapshot elements logged into gallery collections grid.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map((img) => (
                    <div
                      key={img.id}
                      className="bg-blue-950 border border-blue-800 rounded-2xl overflow-hidden relative shadow-lg group"
                    >
                      <div className="w-full h-48 bg-blue-900 overflow-hidden flex items-center justify-center">
                        <img
                          src={img.photoUrl}
                          alt="Match Moment"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-3 bg-blue-950/90 backdrop-blur-sm flex justify-between items-center border-t border-blue-800">
                        <span className="text-[10px] font-mono font-bold text-blue-300">
                          {img.uploadedAt || "Match Moment"}
                        </span>
                        {userRole === "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGalleryItem(img.id)}
                            className="text-red-400 hover:text-red-500 font-bold text-[11px] bg-red-500/10 px-2 py-1 rounded-md"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* SYSTEM ADMIN MANAGEMENT CONTROL ROOM */}
        {userRole === "admin" && (
          <section className="bg-blue-950 border border-red-900 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="border-b border-red-900 pb-2 flex items-center gap-2 text-red-400">
              <ShieldAlert size={18} />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  System Admin Control Room
                </h3>
                <p className="text-[11px] text-red-300 font-medium">
                  Direct write permissions activated for scoreboard entries,
                  themes, and master system initialization loops.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleUpdateMatchOutput}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-blue-900 p-4 rounded-2xl border border-red-900/30"
            >
              <input
                type="text"
                placeholder="Home Team Name"
                value={customHomeTeam}
                onChange={(e) => setCustomHomeTeam(e.target.value)}
                className="bg-blue-950 border border-gray-700 p-2.5 rounded-xl text-xs text-white col-span-2 md:col-span-2"
                required
              />
              <input
                type="text"
                placeholder="Away Team Name"
                value={customAwayTeam}
                onChange={(e) => setCustomAwayTeam(e.target.value)}
                className="bg-blue-950 border border-gray-700 p-2.5 rounded-xl text-xs text-white col-span-2 md:col-span-2"
                required
              />
              <input
                type="number"
                placeholder="Home Score"
                value={newHomeScore}
                onChange={(e) => setNewHomeScore(e.target.value)}
                className="bg-blue-950 border border-gray-700 p-2.5 rounded-xl text-xs text-white"
                required
              />
              <input
                type="number"
                placeholder="Away Score"
                value={newAwayScore}
                onChange={(e) => setNewAwayScore(e.target.value)}
                className="bg-blue-950 border border-gray-700 p-2.5 rounded-xl text-xs text-white"
                required
              />
              <select
                value={selectedScorer}
                onChange={(e) => setSelectedScorer(e.target.value)}
                className="bg-blue-950 border border-gray-700 p-2.5 rounded-xl text-xs text-white"
              >
                <option value="">-- Select Scorer --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedAssister}
                onChange={(e) => setSelectedAssister(e.target.value)}
                className="bg-blue-950 border border-gray-700 p-2.5 rounded-xl text-xs text-white"
              >
                <option value="">-- Select Assister --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="col-span-2 md:col-span-4 bg-red-700 hover:bg-red-600 text-white font-bold p-2.5 rounded-xl text-xs transition"
              >
                Post/Overwrite Live Score Log
              </button>
            </form>

            {/* LIVE DEVICE STADIUM WALLPAPER BACKGROUND UPLOADER TOOL */}
            <div className="bg-blue-900 border border-blue-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
              <div>
                <span className="text-xs text-blue-300 font-black uppercase block">
                  🖼️ Live Device Wallpaper Customizer
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Select any photo directly from your phone storage to push as
                  the global stadium background wallpaper.
                </span>
              </div>
              <label className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer shadow-lg transition-all text-center whitespace-nowrap">
                📁 Change Stadium Wallpaper
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhotoWallpaper}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border-t border-red-900/30 pt-2 flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-mono">
                Pulunga FC Portal Engine v2.5
              </span>
              <button
                type="button"
                onClick={seedPulungaDatabase}
                className="bg-indigo-700 hover:bg-indigo-600 text-white font-mono text-[10px] p-1.5 rounded-lg transition"
              >
                ⚙️ Initialize Mock Seed Collections
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
