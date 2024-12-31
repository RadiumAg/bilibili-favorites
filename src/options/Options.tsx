import React from 'react'
import { useDataContext } from '@/hooks'
import { DataContext } from '@/utils/data-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const Options: React.FC = () => {
  const dataProvideData = useDataContext()

  return (
    <DataContext.Provider value={dataProvideData}>
      <div className="min-w-[786px] min-h-96 shadow-2xl max-w-screen-2xl mx-auto mt-52 bg-white rounded-sm p-2">
        <Tabs defaultValue="account" orientation="horizontal" className="flex">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="account">Make changes to your account here.</TabsContent>
          <TabsContent value="password">Change your password here.</TabsContent>
        </Tabs>
      </div>
    </DataContext.Provider>
  )
}

export default Options
