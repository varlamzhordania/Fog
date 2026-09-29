from unfold.contrib.import_export.forms import (
    ExportForm, ImportForm,SelectableFieldsExportForm,
)
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
from simple_history.admin import SimpleHistoryAdmin

class UnfoldImportExportHistoryAdmin(ModelAdmin, ImportExportModelAdmin,SimpleHistoryAdmin):
    import_form_class = ImportForm
    # export_form_class = ExportForm
    export_form_class = SelectableFieldsExportForm