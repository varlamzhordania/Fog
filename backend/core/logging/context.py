from contextvars import ContextVar

_ctx: ContextVar[dict] = ContextVar("log_ctx", default={})

def bind(**kw):  _ctx.set({**_ctx.get(), **kw})
def clear():     _ctx.set({})
def current():   return _ctx.get()