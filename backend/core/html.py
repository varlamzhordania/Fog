import nh3

TAGS = {"p", "br", "hr", "div", "span", "strong", "b", "em", "i", "u", "s",
        "sub", "sup", "mark",
        "code", "pre", "blockquote", "ul", "ol", "li", "h1", "h2", "h3",
        "h4", "h5", "h6",
        "a", "img", "figure", "figcaption", "table", "thead", "tbody",
        "tr", "th", "td"}
ATTRS = {
    "*": {"class"},
    "a": {"href", "title", "target"},
    "img": {"src", "alt", "title", "width", "height"},
    "td": {"colspan", "rowspan", "style"},
    "th": {"colspan", "rowspan", "style"},
    "span": {"style"}, "p": {"style"},
}
STYLES = {"color", "background-color", "font-size", "font-family",
          "text-align"}


def clean_html(value):
    if not value:
        return value
    return nh3.clean(
        value,
        tags=TAGS,
        attributes=ATTRS,
        filter_style_properties=STYLES
    )
