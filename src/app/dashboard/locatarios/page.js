"use client"

import { createClient } from "@/lib/supabase-browser";
const supabase = createClient();
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Locatarios from "@/components/features/Locatarios";

export default function LocatariosPage() {
  const [usuario, setUsuario] = useState(null);

  const router = useRouter();

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      } else {
        setUsuario(data.user);
      }
    }
    verificarSessao();
  }, []);

  return <Locatarios></Locatarios>;
}
