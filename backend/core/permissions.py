def is_store_admin(user) -> bool:
    """Superusers and members of the 'admin' group."""
    return bool(
        user.is_active and user.is_staff
        and (user.is_superuser or user.groups.filter(name="admin").exists())
    )