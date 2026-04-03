"use client";

import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Unidades from "@/components/features/Unidades";

export default function Unidades() {
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

  return <Unidades></Unidades>;
}
