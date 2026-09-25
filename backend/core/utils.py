from django.contrib import messages
from django.conf import settings
import re


def is_admin(user):
    """
    Checks if the user is an admin.
    Admins are either superusers, staff members, or belong to the 'admin' group.
    """
    return user.is_superuser or user.is_staff or user.groups.filter(name="admin").exists()


def fancy_message(request, body, level="info"):
    """
    Adds a message to the request with the specified level.

    :param request: The request object.
    :param body: The message body, which could be a string or dictionary.
    :param level: The level of the message, could be 'info' or 'error'. Default is 'info'.
    """
    valid_levels = ["info", "error", "success"]
    if level not in valid_levels:
        raise ValueError(f"Invalid level: {level}. Must be one of {valid_levels}")

    if isinstance(body, dict):
        for field_name, error_list in body.items():
            for error in error_list:
                messages.add_message(
                    request,
                    messages.ERROR if level == "error" else messages.INFO,
                    f"{field_name}: {error}"
                )
    elif isinstance(body, str):
        messages.add_message(request, messages.ERROR if level == "error" else messages.INFO, body)
    else:
        raise ValueError("Unsupported message body type")


def string_to_context(input_string):
    """
    Converts a string with template-like variables (e.g., {{ var_name, value }}) into a context dictionary.

    :param input_string: The input string containing context variables.
    :return: A dictionary where the keys are variable names and the values are variable values.
    """
    pattern = r'\{\{([\w\s\?,]+)\}\}'

    matches = re.findall(pattern, input_string)

    context = {}

    for match in matches:
        parts = match.split(',')

        variable_name = parts[0].strip()
        variable_value = parts[1].strip() if len(parts) > 1 else ''

        context[variable_name] = variable_value

    return context




def environment_callback(request):
    """
    Displays an authoritative badge in the Unfold header showing the active environment.
    """
    if getattr(settings, "DEBUG", False):
        return ["Development", "warning"]
    return ["Production", "info"]


def pending_orders_badge_callback(request):
    """
    Calculates the count of pending or unconfirmed checkout orders
    to alert staff directly from the sidebar navigation.
    """
    try:
        from checkout.models import Order
        # Queries orders requiring staff review or pending on-chain payment
        pending_count = Order.objects.filter(
            status__in=[Order.StatusChoices.PENDING,Order.StatusChoices.PAYMENT]
        ).count()
        return str(pending_count) if pending_count > 0 else None
    except Exception:
        # Fallback to prevent admin rendering failures during migrations or DB unavailability
        return None