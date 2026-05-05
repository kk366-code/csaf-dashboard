from datetime import timezone

from apiflask import APIBlueprint
from feedgen.feed import FeedGenerator
from flask import Response

from ..extensions import db
from ..models.advisory import Advisory

rss_bp = APIBlueprint("rss", __name__, tag="RSS")


@rss_bp.get("/rss.xml")
@rss_bp.doc(summary="RSS feed of published advisories")
def rss_feed():
    fg = FeedGenerator()
    fg.id("https://example.com/rss.xml")
    fg.title("CSAF Dashboard — Security Advisories")
    fg.link(href="https://example.com", rel="alternate")
    fg.link(href="https://example.com/rss.xml", rel="self")
    fg.language("en")
    fg.description("Published security advisories from CSAF Dashboard")

    advisories = (
        db.session.query(Advisory)
        .filter_by(status="published")
        .order_by(Advisory.published_at.desc())
        .limit(50)
        .all()
    )

    for advisory in advisories:
        fe = fg.add_entry()
        fe.id(f"https://example.com/advisories/{advisory.id}")
        fe.title(f"[{advisory.severity.upper()}] {advisory.title}")
        fe.link(href=f"https://example.com/advisories/{advisory.id}")
        fe.description(advisory.description or advisory.title)
        if advisory.published_at:
            fe.published(advisory.published_at.replace(tzinfo=timezone.utc))

    return Response(fg.rss_str(pretty=True), mimetype="application/rss+xml")
