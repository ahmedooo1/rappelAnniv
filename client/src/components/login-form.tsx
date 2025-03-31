import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token); //Store token in localStorage
        onSuccess();
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit">Se connecter</Button>
    </form>
  );
}
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token); //Store token in localStorage
      navigate("/dashboard")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit">Se connecter</Button>
    </form>
  )
}
import { useForm } from "react-hook-form";
import { login } from "@/lib/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password);
      onSuccess();
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register("email")} type="email" placeholder="Email" required />
      <Input {...register("password")} type="password" placeholder="Mot de passe" required />
      <Button type="submit">Se connecter</Button>
    </form>
  );
}
