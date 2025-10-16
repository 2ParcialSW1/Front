import { useLoading, ThreeDots } from '@agney/react-loading'

export default function Loading() {
    const { containerProps, indicatorEl } = useLoading({
        loading: true,
        indicator: <ThreeDots width="50" />,
    })

    return (
        <section {...containerProps}>
            {indicatorEl} {/* renders only while loading */}
        </section>
    )
}