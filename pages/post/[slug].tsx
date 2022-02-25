import { url } from 'inspector'
import { GetStaticProps } from 'next'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'
import PortableText from 'react-portable-text'

interface Props {
  post: Post
}

function Post({ post }: Props) {
  return (
    <main>
      <Header />

      <img
        className="h-40 w-full object-cover"
        src={urlFor(post.mainImage).url()!}
        alt=""
      />

      <article className="mx-auto max-w-3xl">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="font -light mb-2 text-xl text-gray-500">
          {post.description}
        </h2>

        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
            alt=""
          />
          <p className="text-sm font-extralight">
            Blog By <span className="text-green-600">{post.author.name}</span>{' '}
            at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-10">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="my-5 text-2xl font-bold" {...props} />
              ),
              h2: (props: any) => (
                <h1 className="my-5 text-xl font-bold" {...props} />
              ),
              li: ({ children }: any) => (
                <li className="ml-4 list-disc">{children}</li>
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline">
                  {children}{' '}
                </a>
              ),
            }}
          />
        </div>

        <hr className="my-5 mx-auto max-w-lg border-yellow-500" />

        <form className="mx-auto mb-10 flex max-w-2xl flex-col p-5">
          <h3 className="text-sm text-yellow-500">
            So you liked this article?
          </h3>
          <h4 className="text-3xl font-bold">Drop a comment then!</h4>
          <hr className="mt-2 py-3" />
          <label className="mb-5 block">
            <span className="text-gray-700">Name</span>
            <input
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              placeholder="Kobe Bryant"
              type="text"
            ></input>
          </label>
          <label className="mb-5 block">
            <span className="text-gray-700">Email</span>
            <input
              className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              placeholder="G-O-A-T@NBA.com"
              type="text"
            ></input>
          </label>
          <label className="mb-5 block">
            <span className="text-gray-700">Comment</span>
            <textarea
              className="form-textarea mt-1 block w-full rounded border py-2 px-3 shadow outline-none ring-yellow-500 focus:ring"
              placeholder="This is my shiiiiiiitttt"
              rows={10}
            ></textarea>
          </label>
        </form>
      </article>
    </main>
  )
}

export default Post

export const getStaticPaths = async () => {
  const query = ` *[_type == "post"]{
        _id,
        slug  {
            current
        }
      }`

  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author -> {
         name,
         image
      },
        'comments': *[
        _type == "comment" &&
        post._ref == ^._id &&
        approved == true
        ],
        description,
        mainImage,
        slug,
        body
      }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      post,
    },
    revalidate: 60,
  }
}
