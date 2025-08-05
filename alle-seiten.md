---
layout: page
---
## Alle Seiten
{% assign year = "1987" %}
<h3>1987</h3>
<ul>
{% for post in site.posts reversed %}
{% assign y = post.date | date: "%Y" %}
{% unless y == year %}
{% assign year = y %}
</ul>
<h3>{{year}}</h3>
<ul>
{% endunless %}
<li><a href="{{site.baseurl}}{{post.url}}">{{post.title}}</a></li>
{% endfor %}
</ul>
