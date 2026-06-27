import { NextResponse } from 'next/server';

/** Consistent empty scaffold response until business logic is wired. */
export function scaffoldResponse(
  module: string,
  methods: string[],
  extra?: Record<string, unknown>
) {
  return NextResponse.json({
    ok: true,
    scaffold: true,
    module,
    methods,
    data: null,
    items: [],
    message: `${module} endpoint scaffolded — business logic not yet implemented.`,
    ...extra,
  });
}

export function scaffoldNotImplemented(module: string) {
  return NextResponse.json(
    {
      ok: false,
      scaffold: true,
      module,
      error: 'Not implemented',
    },
    { status: 501 }
  );
}
