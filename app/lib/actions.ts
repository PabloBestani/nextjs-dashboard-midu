'use server'
// 'user server' marca que todas las funciones que se exportan en este archivo
// son de servidor y no se ejecutan ni se envian al cliente

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const CreateInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    date: z.string(),
    status: z.enum(['pending', 'paid'])
})

const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
    id: true,
    date: true
})

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status')
    });

    // Transformamos para evitar errores de redondeo en la DB
    const amountInCents = amount * 100;

    // Creamos la fecha actual 2023-11-25
    const [date] = new Date().toISOString().split('T');

    await sql`
        INSERT INTO invoices (customer_id, amount, date, status)
        VALUES (${customerId}, ${amountInCents}, ${date}, ${status})
    `
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
};