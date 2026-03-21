import supabase from "@/lib/supabase";
import Image from "next/image";


async function getEdificios(){
  const edificios = await supabase.from('edificios').select('*')
  return edificios
}


export default async function Home() {
  const edificios = await getEdificios()
  
  return (
    <main>
      {edificios.data.map(edificio => ( <h2>{edificio.nome}</h2> ))}
      <h1>Romma</h1>
    </main>
  )
}
