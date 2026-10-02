(function ($) {
    "use strict";

    const MOVE_NODE_ENDPOINT = "move/";
    const GET_CHILDREN_ENDPOINT = "children/";

    const getCsrfToken = () => {
        const script = document.currentScript;

        if (script?.dataset?.csrftoken) {
            return script.dataset.csrftoken;
        }

        const match = document.cookie.match(
            /(?:^|;\s*)csrftoken=([^;]+)/
        );

        return match ? decodeURIComponent(match[1]) : "";
    };

    const CSRF_TOKEN = getCsrfToken();

    const escapeHtml = (value) => {
        return $("<div>").text(value).html();
    };

    class Node {
        constructor(elem) {
            this.$elem = $(elem);
            this.id = this.$elem.data("node-id");
            this.childrenLoaded = Boolean(
                this.$elem.data("children-loaded")
            );
        }

        isCollapsed() {
            return this.$elem
                .find("a.treebeard-collapse")
                .hasClass("treebeard-collapsed");
        }

        children() {
            return $(
                `tr[data-parent-id="${this.id}"]`
            );
        }

        collapse() {
            $.each(this.children(), function () {
                new Node(this).collapse();
            }).hide();

            this.$elem
                .find("a.treebeard-collapse")
                .removeClass("treebeard-expanded")
                .addClass("treebeard-collapsed")
                .attr("aria-expanded", "false");
        }

        expand() {
            const $toggle = this.$elem.find(
                "a.treebeard-collapse"
            );

            if (this.childrenLoaded) {
                this.children().show();

                $toggle
                    .removeClass("treebeard-collapsed")
                    .addClass("treebeard-expanded")
                    .attr("aria-expanded", "true");

                return;
            }

            this.loadChildren();
        }

        toggle() {
            if (this.isCollapsed()) {
                this.expand();
            } else {
                this.collapse();
            }
        }

        loadChildren(
            resultList = [],
            contextList = [],
            page = 1
        ) {
            const $toggle = this.$elem.find(
                "a.treebeard-collapse"
            );

            const params = new URLSearchParams(
                window.location.search
            );

            params.set("p", page);

            $toggle
                .removeClass(
                    "treebeard-collapsed treebeard-expanded"
                )
                .addClass("treebeard-loading");

            $.get(
                `${GET_CHILDREN_ENDPOINT}${this.id}/`,
                params.toString()
            )
                .done((response) => {
                    const $rows = $(response.result_html)
                        .find("#result_list tbody tr");

                    resultList.push(
                        ...$rows.toArray()
                    );

                    contextList.push(
                        ...response.tree_context
                    );

                    if (
                        response.page <
                        response.num_pages
                    ) {
                        this.loadChildren(
                            resultList,
                            contextList,
                            response.page + 1
                        );

                        return;
                    }

                    const $resultRows =
                        $(resultList);

                    setupData(
                        $resultRows,
                        contextList
                    );

                    $resultRows.insertAfter(
                        this.$elem
                    );

                    this.childrenLoaded = true;

                    this.$elem.attr(
                        "data-children-loaded",
                        "1"
                    );

                    $toggle
                        .removeClass(
                            "treebeard-loading treebeard-collapsed"
                        )
                        .addClass(
                            "treebeard-expanded"
                        )
                        .attr(
                            "aria-expanded",
                            "true"
                        );
                })
                .fail(() => {
                    this.childrenLoaded = false;

                    this.$elem.attr(
                        "data-children-loaded",
                        "0"
                    );

                    $toggle
                        .removeClass(
                            "treebeard-loading treebeard-expanded"
                        )
                        .addClass(
                            "treebeard-collapsed"
                        )
                        .attr(
                            "aria-expanded",
                            "false"
                        );
                });
        }
    }

    const normalizeUnfoldRow = ($row) => {
        const $referenceRow = $(
            "#result_list tbody tr"
        ).first();

        if (!$referenceRow.length) {
            return;
        }

        $row.addClass(
            $referenceRow.attr("class") || ""
        );

        $row.children("td, th").each(function (index) {
            const $cell = $(this);
            const $referenceCell =
                $referenceRow
                    .children("td, th")
                    .eq(index);

            if (!$referenceCell.length) {
                return;
            }

            const classes =
                $referenceCell.attr("class");

            if (classes) {
                $cell.attr("class", classes);
            }
        });

        $row.addClass("fog-tree-row");

        const $referenceLink =
            $referenceRow
                .find(".field-name a[href]")
                .last();

        const $objectLink =
            $row
                .find(".field-name a[href]")
                .last();

        if (
            $referenceLink.length &&
            $objectLink.length
        ) {
            const classes =
                $referenceLink.attr("class");

            if (classes) {
                $objectLink.attr(
                    "class",
                    classes
                );
            }
        }
    };

    const normalizeUnfoldBoolean = ($row) => {
        const $referenceRow = $(
            "#result_list tbody tr"
        ).first();

        if (!$referenceRow.length) {
            return;
        }

        $row.children("td, th").each(function (index) {
            const $cell = $(this);

            const $booleanIcon = $cell.find(
                "img[src*='icon-yes'], img[src*='icon-no']"
            );

            if (!$booleanIcon.length) {
                return;
            }

            const $referenceCell =
                $referenceRow
                    .children("td, th")
                    .eq(index);

            if (!$referenceCell.length) {
                return;
            }

            const isTrue =
                $booleanIcon.attr("alt") === "True";

            const $stateReference =
                $referenceCell
                    .find(
                        `div[title='${isTrue ? "True" : "False"}']`
                    )
                    .first();

            if (!$stateReference.length) {
                return;
            }

            const $boolean =
                $stateReference.clone(true);

            $boolean.attr(
                "title",
                isTrue ? "True" : "False"
            );

            const $icon =
                $boolean.find(
                    ".material-symbols-outlined"
                );

            if ($icon.length) {
                $icon.text(
                    isTrue
                        ? "check_small"
                        : "close_small"
                );
            }

            $cell.html($boolean);
        });
    };

    const setupData = (
        $resultList,
        contextList
    ) => {
        $resultList.each((index, element) => {
            const context =
                contextList[index];

            if (!context) {
                return;
            }

            const $row = $(element);

            Object.entries(context).forEach(
                ([key, value]) => {
                    $row.attr(
                        `data-${key}`,
                        value
                    );
                }
            );
        });

        $resultList.each((index, element) => {
            const $row = $(element);

            normalizeUnfoldRow($row);
            normalizeUnfoldBoolean($row);

            const $firstCell =
                $row
                    .children("td, th")
                    .not(".action-checkbox")
                    .first();

            if (!$firstCell.length) {
                return;
            }

            $firstCell
                .find(
                    ".drag-handler, .tree-indent, .treebeard-collapse"
                )
                .remove();

            const hasChildren = Number(
                $row.data("has-children")
            );

            const canChange = Number(
                $row.data("can-change")
            );

            const level = Number(
                $row.data("level")
            );

            const elements = [];

            const nodeName =
                $row
                    .find(".field-name a[href]")
                    .last()
                    .text()
                    .trim();

            elements.push(
                canChange
                    ? `<span
                            class="drag-handler"
                            draggable="true"
                            aria-label="Drag ${escapeHtml(nodeName)}"
                       ></span>`
                    : `<span
                            class="drag-handler drag-handler-disabled"
                            aria-hidden="true"
                       ></span>`
            );

            if (level > 1) {
                elements.push(
                    "<span class='tree-indent' aria-hidden='true'></span>"
                        .repeat(level - 1)
                );
            }

            if (hasChildren) {
                elements.push(
                    `<a
                        href="#"
                        class="treebeard-collapse treebeard-collapsed"
                        role="button"
                        aria-label="Expand category"
                        aria-expanded="false"
                    ></a>`
                );
            }

            $firstCell.prepend(
                elements.join("")
            );

            const $objectLink =
                $firstCell
                    .find("a[href]")
                    .last();

            if ($objectLink.length) {
                $objectLink.addClass(
                    "text-important"
                );
            }
        });
    };

    const setupDragHandler = () => {
        if (
            $("#has-change-permission").val() === "0"
        ) {
            return;
        }

        const $body = $("body");
        const $resultList = $("#result_list");

        let draggedNode = null;
        let targetNode = null;
        let relation = "child";

        const $ghost = $("<div>", {
            id: "fog-tree-ghost",
        })
            .appendTo($body)
            .hide();

        const updateDropIndicator = (
            $row,
            type
        ) => {
            $row
                .removeClass(
                    "tree-drop-child tree-drop-sibling"
                )
                .addClass(
                    `tree-drop-${type}`
                );
        };

        const removeDropIndicator = ($row) => {
            $row.removeClass(
                "tree-drop-child tree-drop-sibling"
            );
        };

        const clearTargetState = () => {
            if (!targetNode) {
                return;
            }

            removeDropIndicator(
                targetNode.$elem
            );

            targetNode = null;
        };

        const clearDragState = () => {
            if (draggedNode) {
                draggedNode.$elem.removeClass(
                    "tree-dragging"
                );
            }

            clearTargetState();

            $ghost.hide();

            draggedNode = null;
            targetNode = null;
            relation = "child";
        };

        $resultList.on(
            "dragstart",
            ".drag-handler[draggable='true']",
            function (event) {
                const originalEvent =
                    event.originalEvent;

                const $row =
                    $(this).closest("tr");

                draggedNode =
                    new Node($row[0]);

                draggedNode.$elem.addClass(
                    "tree-dragging"
                );

                const nodeName =
                    draggedNode.$elem
                        .find(
                            ".field-name a[href]"
                        )
                        .last()
                        .text()
                        .trim();

                $ghost
                    .html(`
                        <div class="fog-tree-ghost-inner">
                            <span
                                class="material-symbols-outlined"
                                aria-hidden="true"
                            >
                                drag_indicator
                            </span>

                            <span class="fog-tree-ghost-name">
                                ${escapeHtml(nodeName)}
                            </span>
                        </div>
                    `)
                    .show();

                originalEvent.dataTransfer.effectAllowed =
                    "move";

                originalEvent.dataTransfer.setDragImage(
                    $ghost[0],
                    20,
                    20
                );
            }
        );

        $resultList.on(
            "dragenter",
            "tbody tr",
            function () {
                if (!draggedNode) {
                    return;
                }

                const $row = $(this);

                if (
                    String(draggedNode.id) ===
                    String(
                        $row.data("node-id")
                    )
                ) {
                    return;
                }

                const node = new Node(this);

                if (node.isCollapsed()) {
                    node.expand();
                }
            }
        );

        $resultList.on(
            "dragover",
            "tbody tr",
            function (event) {
                if (!draggedNode) {
                    return;
                }

                event.preventDefault();

                const $row = $(this);
                const targetId =
                    $row.data("node-id");

                if (
                    String(targetId) ===
                    String(draggedNode.id)
                ) {
                    clearTargetState();

                    event.originalEvent
                        .dataTransfer
                        .dropEffect = "none";

                    return;
                }

                if (
                    targetNode &&
                    targetNode.$elem[0] !==
                    $row[0]
                ) {
                    removeDropIndicator(
                        targetNode.$elem
                    );
                }

                targetNode =
                    new Node(this);

                const rect =
                    this.getBoundingClientRect();

                const relativeY =
                    rect.height > 0
                        ? (
                            event.originalEvent
                                .clientY -
                            rect.top
                        ) /
                        rect.height
                        : 0.5;

                if (relativeY < 0.45) {
                    relation = "sibling";

                    updateDropIndicator(
                        $row,
                        "sibling"
                    );
                } else {
                    relation = "child";

                    updateDropIndicator(
                        $row,
                        "child"
                    );
                }

                event.originalEvent
                    .dataTransfer
                    .dropEffect = "move";
            }
        );

        $resultList.on(
            "drop",
            "tbody tr",
            function (event) {
                event.preventDefault();

                if (
                    !draggedNode ||
                    !targetNode
                ) {
                    clearDragState();
                    return;
                }

                if (
                    String(targetNode.id) ===
                    String(draggedNode.id)
                ) {
                    clearDragState();
                    return;
                }

                const nodeId =
                    draggedNode.id;

                const targetId =
                    targetNode.id;

                const moveRelation =
                    relation;

                $.post({
                    url: MOVE_NODE_ENDPOINT,
                    data: {
                        node: nodeId,
                        target: targetId,
                        relation: moveRelation,
                    },
                    headers: {
                        "X-CSRFToken":
                            CSRF_TOKEN,
                    },
                })
                    .done(() => {
                        window.location.reload();
                    })
                    .fail(() => {
                        clearDragState();
                    });
            }
        );

        $body.on(
            "dragend",
            clearDragState
        );

        $body.on(
            "drop",
            function (event) {
                if (
                    !$(event.target).closest(
                        "#result_list"
                    ).length
                ) {
                    clearDragState();
                }
            }
        );
    };

    $(document).ready(function () {
        const $resultList =
            $("#result_list tbody tr");

        const contextElement =
            document.getElementById(
                "tree-context"
            );

        if (!contextElement) {
            return;
        }

        let contextList = [];

        try {
            contextList = JSON.parse(
                contextElement.textContent
            );
        } catch (error) {
            console.error(
                "FOG Treebeard: invalid tree context.",
                error
            );

            return;
        }

        setupData(
            $resultList,
            contextList
        );

        $("#result_list").on(
            "click",
            "a.treebeard-collapse",
            function (event) {
                event.preventDefault();

                const node =
                    new Node(
                        $(event.currentTarget)
                            .closest("tr")[0]
                    );

                node.toggle();

                $(event.currentTarget).attr(
                    "aria-expanded",
                    node.isCollapsed()
                        ? "false"
                        : "true"
                );
            }
        );

        setupDragHandler();
    });
})(django.jQuery);