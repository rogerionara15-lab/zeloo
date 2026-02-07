import { useEffect } from "react"
import { supabase } from "./services/supabaseClient"

export function SupabaseTest() {
  useEffect(() => {
    async function run() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("❌ Supabase ERRO:", error)
        return
      }

      console.log("✅ Supabase conectado com sucesso")
      console.log("Session:", data.session)
    }

    run()
  }, [])

  return null
}
