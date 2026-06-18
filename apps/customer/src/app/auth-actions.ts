'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@p4p/db';

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Ensure matching Customer profile exists
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await ensureCustomerProfile(user);
  }

  redirect(redirectTo);
}

export async function signup(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!email || !password || !firstName || !lastName) {
    return { error: 'All fields are required.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const user = data.user;
  if (user) {
    await prisma.customer.upsert({
      where: { email: user.email! },
      update: {
        id: user.id,
        firstName,
        lastName,
      },
      create: {
        id: user.id,
        email: user.email!,
        firstName,
        lastName,
      },
    });
  }

  redirect(redirectTo);
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

async function ensureCustomerProfile(user: any) {
  const email = user.email!;
  const existing = await prisma.customer.findFirst({
    where: {
      OR: [{ id: user.id }, { email }],
    },
  });

  const fullName = user.user_metadata?.full_name || '';
  const parts = fullName.split(' ');
  const firstName = parts[0] || 'Parent';
  const lastName = parts.slice(1).join(' ') || 'User';

  if (!existing) {
    await prisma.customer.create({
      data: {
        id: user.id,
        email,
        firstName,
        lastName,
      },
    });
  } else if (existing.id !== user.id) {
    await prisma.customer.update({
      where: { email },
      data: { id: user.id },
    });
  }
}
