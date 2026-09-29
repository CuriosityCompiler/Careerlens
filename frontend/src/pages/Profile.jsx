import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  User,
  Camera,
  Mail,
  Linkedin,
  Github,
  Globe,
  Plus,
  X,
  Save,
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function Profile() {
  const { user, bootstrap } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("frontend");
  const [education, setEducation] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [roles, setRoles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/roles").then((r) => setRoles(r.data)).catch(() => {});
    api.get("/users/profile")
      .then((r) => {
        const u = r.data;
        setName(u.name || "");
        setEmail(u.email || "");
        setTargetRole(u.target_role || "frontend");
        setEducation(u.education || "");
        setBio(u.bio || "");
        setGithub(u.github || "");
        setLinkedin(u.linkedin || "");
        setProfilePic(u.profile_pic || "");
        setSkills(u.skills || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Image file must be under 2MB.");
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePic(reader.result);
      toast.success("Profile photo updated preview.");
    };
    reader.readAsDataURL(file);
  };

  const addSkill = (e) => {
    e?.preventDefault();
    const s = newSkill.trim().toLowerCase();
    if (!s) return;
    if (skills.includes(s)) {
      return toast.info("Skill already in your profile.");
    }
    setSkills([...skills, s]);
    setNewSkill("");
  };

  const removeSkill = (sToRemove) => {
    setSkills(skills.filter((s) => s !== sToRemove));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.put("/users/profile", {
        name,
        target_role: targetRole,
        education,
        bio,
        github,
        linkedin,
        profile_pic: profilePic,
        skills,
      });
      await bootstrap();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Loading user profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" data-testid="profile-page">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Candidate Profile
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Manage your career identity, technical skills, social integrations, and portfolio links.
        </p>
      </div>

      <form onSubmit={saveProfile} className="space-y-6">
        {/* Profile Card Header with Photo */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-slate-100 dark:bg-slate-800 grid place-items-center shadow-inner">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[11px] font-medium">
                <Camera className="w-5 h-5 mb-0.5" /> Change
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Outfit, sans-serif" }}>
                {name || "Candidate Name"}
              </h2>
              <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="capitalize text-indigo-600 dark:text-indigo-400 font-semibold">
                  {roles.find((r) => r.id === targetRole)?.name || targetRole}
                </span>
                <span>·</span>
                <span>{email}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {education || "Add your education and degree details"}
              </div>
            </div>
          </div>
        </Card>

        {/* Basic Details */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="dark:text-slate-300">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vic Chen"
                required
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <Label className="dark:text-slate-300">Target Role</Label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="dark:text-slate-300">Education & Graduation Year</Label>
            <Input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="State University -> B.S. Computer Science, 2024"
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div>
            <Label className="dark:text-slate-300">Bio / About Me (What you do and have built)</Label>
            <Textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Passionate engineer building accessible high-performance web apps. Shipped dashboards serving 12k monthly users..."
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
          </div>
        </Card>

        {/* Skills Tag Management */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
            Technical & Soft Skills
          </h3>

          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill(e)}
              placeholder="Add a new skill (e.g. docker, postgresql, nextjs)..."
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
            <Button
              type="button"
              onClick={addSkill}
              variant="outline"
              className="shrink-0 border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              >
                <span className="capitalize">{s}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="hover:text-red-500 rounded-full p-0.5"
                  title="Remove skill"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <span className="text-xs text-slate-400">No skills added yet.</span>
            )}
          </div>
        </Card>

        {/* Social and Portfolio Integrations */}
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
            Links & Social Integrations
          </h3>

          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-1.5 dark:text-slate-300">
                <Github className="w-4 h-4 text-slate-600 dark:text-slate-400" /> GitHub Profile URL
              </Label>
              <Input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5 dark:text-slate-300">
                <Linkedin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> LinkedIn Profile URL
              </Label>
              <Input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <Label className="flex items-center gap-1.5 dark:text-slate-300">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Contact Email (Gmail / Work)
              </Label>
              <Input
                value={email}
                disabled
                className="bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 cursor-not-allowed text-slate-500"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={busy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-6"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
