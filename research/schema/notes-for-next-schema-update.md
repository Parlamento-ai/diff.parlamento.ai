- sponsors can't be always humans, in spain they are the political parties not the parlamentarians
- Remove `document_version` as a source-of-truth concept for now. The theoretical model should be event/patch based: an original `act` plus the accepted `change_set`s, applied in order, is how we derive the current text (`act + bill/change_set1 + ... + change_setN = today`). A `change_set` should hold the computable legal change itself, not just explain the difference between two stored snapshots. If we later need snapshots for speed, debugging, archival proof, or cache invalidation, add them back as generated/materialized checkpoints, not as the canonical representation.
- maybe add the notion of `groups` so we have comissions
- maybe add the notion of `entities` so we have each parlamentarian but also parties, at the same level, political parties would be considered 'legal person', and we could link to this in the sponsors section

