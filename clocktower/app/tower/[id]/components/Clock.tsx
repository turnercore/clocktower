// Clock.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { ClockRowData, UUID } from '@/types/schemas'
import { RealtimeClock } from './RealtimeClock'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

interface ClockServerProps {
  clockId: UUID
}

export const Clock: React.FC<ClockServerProps> = async ({ clockId }) => {
  const supabase = createServerComponentClient<Database>({ cookies })
  const { data: clockData, error: clockError } = await supabase
    .from('clocks')
    .select('*')
    .eq('id', clockId)
    .single()
  if (clockError) {
    console.error(clockError)
    return <p>Error loading clock data.</p>
  }

  const initialData: ClockRowData = clockData as ClockRowData //TODO: Fix the types to make this not necessary

  return <RealtimeClock initialData={initialData} />
}
