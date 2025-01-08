import React from 'react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { DataContext } from '@/utils/data-context'
import { z } from 'zod'

type FormData = {
  key: string
  baseUrl: string
}

const formSchema = z.object({
  key: z.string(),
  baseUrl: z.string(),
})

const Setting: React.FC = () => {
  const dataProvider = React.use(DataContext)
  const form = useForm<z.infer<typeof formSchema>>({})

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    dataProvider.dispatch?.((oldValue) => {
      return {
        ...oldValue,
        aiConfig: {
          key: data.key,
          baseUrl: data.baseUrl,
        },
      }
    })
  }

  React.useEffect(() => {
    form.setValue('key', dataProvider.aiConfig.key || '')
    form.setValue('baseUrl', dataProvider.aiConfig.baseUrl || '')
  }, [dataProvider.aiConfig.baseUrl, dataProvider.aiConfig.key])

  return (
    <Form {...form}>
      <form onChange={form.handleSubmit(handleSubmit)} className="space-y-8 w-[50%] ">
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>key</FormLabel>
              <FormControl>
                <Input placeholder="open ai key" {...field} />
              </FormControl>
              <FormDescription>ai key</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>baseUrl</FormLabel>
              <FormControl>
                <Input placeholder="baseUrl" {...field} />
              </FormControl>
              <FormDescription>ai baseurl</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default Setting
