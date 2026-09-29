from unfold.contrib.import_export.forms import (
    ExportForm, ImportForm,SelectableFieldsExportForm,
)
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin

class UnfoldImportExportAdmin(ModelAdmin, ImportExportModelAdmin):
    import_form_class = ImportForm
    # export_form_class = ExportForm
    export_form_class = SelectableFieldsExportForm