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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

type FormData = {
  key: string
  baseUrl: string
}

const formSchema = z.object({
  key: z.string(),
  baseUrl: z.string(),
  model: z.string(),
})

const Setting: React.FC = () => {
  const dataProvider = React.use(DataContext)
  const form = useForm<z.infer<typeof formSchema>>({})

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    dataProvider.dispatch?.((oldValue) => {
      console.log(data)
      return {
        ...oldValue,
        aiConfig: {
          key: data.key,
          model: data.model,
          baseUrl: data.baseUrl,
        },
      }
    })
  }

  React.useEffect(() => {
    form.setValue('key', dataProvider.aiConfig.key || '')
    form.setValue('baseUrl', dataProvider.aiConfig.baseUrl || '')
    form.setValue('model', dataProvider.aiConfig.model || '')
  }, [dataProvider.aiConfig.baseUrl, dataProvider.aiConfig.key, dataProvider.aiConfig.model])

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

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>model</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="please select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">none</SelectItem>
                    <SelectItem value="gpt-3.5-turbo" defaultChecked>
                      gpt-3.5-turbo
                    </SelectItem>
                    <SelectItem value="o1">gpt-4</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>如果你要使用星火等其它大模型，请使用none即可</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

export default Setting
