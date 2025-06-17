'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { CounterValidation } from '@/validations/CounterValidation';

export const CounterForm = () => {
  const t = useTranslations('CounterForm');
  const form = useForm({
    resolver: zodResolver(CounterValidation),
    defaultValues: {
      increment: 0,
    },
  });
  const router = useRouter();

  const handleIncrement = form.handleSubmit(async (data) => {
    await fetch(`/api/counter`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    form.reset();
    router.refresh();
  });

  return (
    <form onSubmit={handleIncrement} className="space-y-4">
      <p className="text-sm sm:text-base">{t('presentation')}</p>
      <div className="space-y-2">
        <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-bold text-gray-700" htmlFor="increment">
          <span>{t('label_increment')}</span>
          <input
            id="increment"
            type="number"
            className="w-full sm:w-32 appearance-none rounded-sm border border-gray-200 px-3 py-2 text-sm leading-tight text-gray-700 focus:outline-hidden focus:ring-3 focus:ring-blue-300/50"
            {...form.register('increment')}
          />
        </label>

        {form.formState.errors.increment?.message && (
          <div className="text-xs italic text-red-500">{form.formState.errors.increment?.message}</div>
        )}
      </div>

      <div>
        <button
          className="w-full sm:w-auto rounded-sm bg-blue-500 px-6 py-2 font-bold text-white hover:bg-blue-600 focus:outline-hidden focus:ring-3 focus:ring-blue-300/50 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {t('button_increment')}
        </button>
      </div>
    </form>
  );
};
