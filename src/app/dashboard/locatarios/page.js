import { getLocatarios, getContratos } from "@/lib/queries-server"
import LocatariosDesktop from "@/components/features/LocatariosDesktop"

export default async function LocatariosPage() {
  const [locatarios, contratos] = await Promise.all([
    getLocatarios(),
    getContratos(),
  ])

  return (
    <LocatariosDesktop
      initialLocatarios={locatarios ?? []}
      contratos={contratos ?? []}
    />
  )
}
