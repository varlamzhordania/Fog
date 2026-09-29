from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

# Every project fixture as (app label, fixture name), in dependency order:
# a fixture must come after the fixtures it references.
FIXTURES = [
    ("account", "groups"),
    ("account", "users"),
    ("account", "addresses"),
    ("inventory", "categories"),
    ("inventory", "tags"),
    ("inventory", "products"),
    ("inventory", "product_stocks"),
    ("checkout", "payment_methods"),
    ("checkout", "orders"),
    ("inventory", "stock_reservations"),
    ("inventory", "stock_logs"),
    ("checkout", "shopping_carts"),
]


# Fixtures each fixture references. `--only` loads these too, so a partial
# load never fails on a missing foreign key.
DEPENDENCIES = {
    "users": {"groups"},
    "addresses": {"users"},
    "products": {"categories", "tags"},
    "product_stocks": {"products"},
    "orders": {"users", "addresses", "products"},
    "stock_reservations": {"orders", "product_stocks"},
    "stock_logs": {"product_stocks", "users"},
    "shopping_carts": {"users", "products"},
}


def resolve_dependencies(names):
    resolved = set(names)
    pending = list(names)

    while pending:
        for dependency in DEPENDENCIES.get(pending.pop(), ()):
            if dependency not in resolved:
                resolved.add(dependency)
                pending.append(dependency)

    return resolved


def fixture_path(app_label, name):
    return Path(apps.get_app_config(app_label).path) / "fixtures" / f"{name}.json"


class Command(BaseCommand):
    help = (
        "Loads every project fixture (accounts, catalog, stock, checkout) "
        "in dependency order. Existing rows with the same primary key are updated."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--only",
            nargs="+",
            metavar="NAME",
            help="Load only these fixture names or app labels (plus the "
                 "fixtures they depend on), e.g. --only inventory  or  "
                 "--only categories tags.",
        )
        parser.add_argument(
            "--list",
            action="store_true",
            help="List the available fixtures and exit.",
        )
        parser.add_argument(
            "--database",
            default="default",
            help="Database to load the fixtures into (default: 'default').",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Allow loading when DEBUG is off. The fixture users share a "
                 "known development password, so never use this in production.",
        )

    def handle(self, *args, **options):
        if options["list"]:
            self.print_list()
            return

        if not settings.DEBUG and not options["force"]:
            raise CommandError(
                "Refusing to load development fixtures while DEBUG is off "
                "(fixture users share a known password). Use --force to override."
            )

        selected = self.select_fixtures(options["only"])
        names = [name for _, name in selected]

        missing = [
            str(fixture_path(app, name))
            for app, name in selected
            if not fixture_path(app, name).exists()
        ]
        if missing:
            raise CommandError(
                "Missing fixture files:\n  " + "\n  ".join(missing)
            )

        self.stdout.write(f"Loading {len(names)} fixtures: {', '.join(names)}")

        # A single loaddata call runs in one transaction and checks foreign keys
        # once at the end, so a failure leaves the database untouched.
        call_command(
            "loaddata",
            *names,
            database=options["database"],
            verbosity=options["verbosity"],
        )

        self.stdout.write(self.style.SUCCESS("Fixtures loaded successfully."))

    def select_fixtures(self, only):
        if not only:
            return FIXTURES

        known = {name for _, name in FIXTURES} | {app for app, _ in FIXTURES}
        unknown = [item for item in only if item not in known]
        if unknown:
            raise CommandError(
                f"Unknown fixture or app: {', '.join(unknown)}. "
                "Run with --list to see what is available."
            )

        requested = {
            name for app, name in FIXTURES if name in only or app in only
        }
        resolved = resolve_dependencies(requested)

        added = [name for _, name in FIXTURES if name in resolved - requested]
        if added:
            self.stdout.write(
                f"Also loading required dependencies: {', '.join(added)}"
            )

        return [(app, name) for app, name in FIXTURES if name in resolved]

    def print_list(self):
        for app, name in FIXTURES:
            state = "ok" if fixture_path(app, name).exists() else "MISSING"
            self.stdout.write(f"  {app:<10}{name:<22}{state}")
