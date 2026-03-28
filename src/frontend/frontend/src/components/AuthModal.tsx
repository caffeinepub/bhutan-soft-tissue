import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface User {
  name: string;
  credential: string;
  password: string;
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (user: User) => void;
}

async function sha256hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem("bst_users") || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem("bst_users", JSON.stringify(users));
}

export default function AuthModal({
  open,
  onOpenChange,
  onLogin,
}: AuthModalProps) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginForm, setLoginForm] = useState({ credential: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    credential: "",
    password: "",
    confirm: "",
  });

  const handleLogin = async () => {
    const users = getUsers();
    const hashedInput = await sha256hex(loginForm.password);
    const user = users.find(
      (u) =>
        u.credential === loginForm.credential && u.password === hashedInput,
    );
    if (!user) {
      toast.error("Invalid credentials. Please try again.");
      return;
    }
    toast.success(`Welcome back, ${user.name}!`);
    onLogin(user);
    onOpenChange(false);
  };

  const handleRegister = async () => {
    if (
      !registerForm.name ||
      !registerForm.credential ||
      !registerForm.password
    ) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (registerForm.password !== registerForm.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    const users = getUsers();
    if (users.find((u) => u.credential === registerForm.credential)) {
      toast.error("Account already exists with this email/phone.");
      return;
    }
    const newUser: User = {
      name: registerForm.name,
      credential: registerForm.credential,
      password: await sha256hex(registerForm.password),
    };
    saveUsers([...users, newUser]);
    toast.success("Account created! You are now logged in.");
    onLogin(newUser);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-ocid="auth.dialog">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-brand-forest text-center">
            Opal Tissue Account
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="signin" className="mt-2">
          <TabsList className="w-full bg-brand-beige">
            <TabsTrigger
              value="signin"
              data-ocid="auth.signin.tab"
              className="flex-1 data-[state=active]:bg-brand-forest data-[state=active]:text-white"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="register"
              data-ocid="auth.register.tab"
              className="flex-1 data-[state=active]:bg-brand-forest data-[state=active]:text-white"
            >
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label htmlFor="login-credential">Mobile Number or Email</Label>
              <Input
                id="login-credential"
                data-ocid="auth.signin.input"
                value={loginForm.credential}
                onChange={(e) =>
                  setLoginForm((p) => ({ ...p, credential: e.target.value }))
                }
                placeholder="Email or mobile number"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  data-ocid="auth.signin.input"
                  type={showPass ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Password"
                  className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && void handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-brand-forest hover:underline"
            >
              Forgot Password?
            </button>
            <Button
              data-ocid="auth.signin.submit_button"
              onClick={() => void handleLogin()}
              className="w-full rounded-full bg-brand-forest hover:bg-brand-forest/90 text-white font-semibold tracking-wide"
            >
              LOG IN
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                data-ocid="auth.register.input"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-credential">Mobile Number or Email</Label>
              <Input
                id="reg-credential"
                data-ocid="auth.register.input"
                value={registerForm.credential}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, credential: e.target.value }))
                }
                placeholder="Email or mobile number"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  data-ocid="auth.register.input"
                  type={showPass ? "text" : "password"}
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  data-ocid="auth.register.input"
                  type={showConfirm ? "text" : "password"}
                  value={registerForm.confirm}
                  onChange={(e) =>
                    setRegisterForm((p) => ({ ...p, confirm: e.target.value }))
                  }
                  placeholder="Confirm password"
                  className="pr-10"
                  onKeyDown={(e) => e.key === "Enter" && void handleRegister()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              data-ocid="auth.register.submit_button"
              onClick={() => void handleRegister()}
              className="w-full rounded-full bg-brand-forest hover:bg-brand-forest/90 text-white font-semibold tracking-wide"
            >
              REGISTER
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
