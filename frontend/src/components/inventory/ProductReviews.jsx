"use client";

import {useState} from "react";
import Link from "next/link";
import {Button, Card, Form, Label, Skeleton, TextArea, TextField, toast, Typography} from "@heroui/react";
import {Star} from "lucide-react";
import Icon from "@/components/icon/Icon";
import Stars from "@/components/inventory/Stars";
import {useConfig} from "@/queries/settings";
import {useAuthStore} from "@/stores/auth";
import {useDeleteReview, useMyReview, useReviews, useSaveReview} from "@/queries/inventory";
import {getApiErrorMessage} from "@/lib/utils";
import {formatDate} from "@/lib/orders";

export default function ProductReviews({product}) {
    const slug = product.slug;
    const {data: config} = useConfig();
    const loggedIn = useAuthStore((s) => s.logged_in);
    const enabled = config?.PRODUCT_REVIEWS_ENABLED !== false;

    const [page, setPage] = useState(1);
    const {data, isLoading} = useReviews(slug, page);
    const {data: mine} = useMyReview(slug, loggedIn && enabled);

    const reviews = data?.results ?? [];
    const summary = data?.summary ?? {average: product.rating_average, count: product.rating_count};
    const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 10));

    return (
        <section className="mt-24 max-w-4xl border-t border-default-200 pt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-2xl font-semibold">Customer reviews</h2>
                {summary.count > 0 && (
                    <div className="flex items-center gap-2">
                        <Stars value={summary.average}/>
                        <span className="text-sm text-muted">
                            {Number(summary.average).toFixed(1)} · {summary.count}{" "}
                            {summary.count === 1 ? "review" : "reviews"}
                        </span>
                    </div>
                )}
            </div>

            {enabled && (
                <div className="mt-6">
                    {!loggedIn ? (
                        <Typography type="body-sm" className="text-muted">
                            <Link href="/login" className="text-accent">Sign in</Link> to review products you bought.
                        </Typography>
                    ) : mine && !mine.has_purchased && !mine.review ? (
                        <Typography type="body-sm" className="text-muted">
                            Only customers with a delivered order of this product can review it.
                        </Typography>
                    ) : mine ? (
                        <ReviewForm key={mine.review?.id ?? "new"} slug={slug} review={mine.review}/>
                    ) : null}
                </div>
            )}

            {!enabled && (
                <Typography type="body-xs" className="mt-4 text-muted">
                    New reviews are temporarily disabled.
                </Typography>
            )}

            <div className="mt-8 flex flex-col gap-4">
                {isLoading && <Skeleton className="h-24 w-full rounded-xl"/>}

                {!isLoading && reviews.length === 0 && (
                    <Typography type="body-sm" className="text-muted">No reviews yet.</Typography>
                )}

                {reviews.map((review) => (
                    <Card key={review.id}>
                        <Card.Content className="flex flex-col gap-2 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Typography type={"body-md"}>
                                        {review.author}
                                        {review.is_mine && <span className="text-xs text-accent mx-1">(You)</span>}
                                    </Typography>
                                    <Stars value={review.rating} className={"size-4"}/>

                                </div>
                                <span className="text-xs text-muted">{formatDate(review.created_at)}</span>
                            </div>
                            {review.comment && (
                                <Typography type={"body-sm"} className="whitespace-pre-line">{review.comment}</Typography>
                            )}
                        </Card.Content>
                    </Card>
                ))}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3">
                        <Button size="sm" variant="secondary" isDisabled={page === 1}
                                onPress={() => setPage((p) => p - 1)}>Previous</Button>
                        <span className="text-sm text-muted">{page} / {totalPages}</span>
                        <Button size="sm" variant="secondary" isDisabled={page === totalPages}
                                onPress={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                )}
            </div>
        </section>
    );
}

function ReviewForm({slug, review}) {
    const save = useSaveReview(slug);
    const remove = useDeleteReview(slug);
    const [rating, setRating] = useState(review?.rating ?? 0);
    const [comment, setComment] = useState(review?.comment ?? "");
    const [hover, setHover] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!rating) return toast.danger("Please choose a rating.");

        save.mutate(
            {exists: Boolean(review), data: {rating, comment}},
            {
                onSuccess: () => toast.success(review ? "Review updated." : "Thanks for your review!"),
                onError: (error) => toast.danger(getApiErrorMessage(error, "Could not save your review.")),
            }
        );
    };

    const handleDelete = () =>
        remove.mutate(undefined, {
            onSuccess: () => {
                setRating(0);
                setComment("");
                toast.success("Review removed.");
            },
            onError: (error) => toast.danger(getApiErrorMessage(error)),
        });

    return (
        <Card>
            <Card.Content className="p-5">
                <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Typography type="h3" className="text-lg font-medium">
                        {review ? "Edit your review" : "Write a review"}
                    </Typography>

                    <div role="radiogroup" aria-label="Rating" className="flex gap-1"
                         onMouseLeave={() => setHover(0)}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                role="radio"
                                aria-checked={rating === n}
                                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                                onClick={() => setRating(n)}
                                onMouseEnter={() => setHover(n)}
                                className="rounded p-0.5"
                            >
                                <Icon
                                    icon={Star}
                                    className={`size-7 transition-colors ${
                                        n <= (hover || rating) ? "fill-warning text-warning" : "text-muted"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    <TextField variant="secondary" name="comment" value={comment} onChange={setComment}>
                        <Label>Comment (optional)</Label>
                        <TextArea rows={4} maxLength={2000} placeholder="What did you think of this product?"/>
                    </TextField>

                    <div className="flex gap-3">
                        <Button type="submit" isPending={save.isPending} isDisabled={save.isPending}>
                            {review ? "Save changes" : "Submit review"}
                        </Button>
                        {review && (
                            <Button type="button" variant="ghost" className="text-danger"
                                    isPending={remove.isPending} onPress={handleDelete}>
                                Delete
                            </Button>
                        )}
                    </div>
                </Form>
            </Card.Content>
        </Card>
    );
}